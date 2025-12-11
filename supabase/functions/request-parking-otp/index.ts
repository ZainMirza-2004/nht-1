// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Inline rate limiting (simple in-memory store)
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}
const rateLimitStore: RateLimitStore = {};

function checkRateLimit(req: Request, maxRequests: number, windowMs: number): Response | null {
  // Get client IP
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  const key = forwarded?.split(",")[0] || realIp || cfConnectingIp || "unknown";
  
  const now = Date.now();
  const record = rateLimitStore[key];

  // Clean up old entries periodically
  if (Object.keys(rateLimitStore).length > 10000) {
    for (const k in rateLimitStore) {
      if (rateLimitStore[k].resetAt < now) {
        delete rateLimitStore[k];
      }
    }
  }

  // Check if record exists and is still valid
  if (record && record.resetAt > now) {
    if (record.count >= maxRequests) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Please try again later.",
          retryAfter: Math.ceil((record.resetAt - now) / 1000),
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": Math.ceil((record.resetAt - now) / 1000).toString(),
          },
        }
      );
    }
    record.count++;
  } else {
    // Create new record or reset expired one
    rateLimitStore[key] = {
      count: 1,
      resetAt: now + windowMs,
    };
  }

  return null; // Allowed
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight first (should not be rate limited)
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // SECURITY FIX: Rate limiting to prevent abuse
  const rateLimitResponse = checkRateLimit(req, 5, 15 * 60 * 1000); // 5 requests per 15 minutes
  
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { phoneNumber } = await req.json();

    if (!phoneNumber) {
      return new Response(
        JSON.stringify({ success: false, message: "Phone number is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // SECURITY FIX: Validate phone number format (E.164 format)
    // Allow international format: +[country code][number]
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    const cleanPhone = phoneNumber.trim().replace(/\s+/g, '');
    
    if (!phoneRegex.test(cleanPhone)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Invalid phone number format. Please use international format (e.g., +441234567890)" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Use cleaned phone number
    const validatedPhoneNumber = cleanPhone;

    // Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in database with expiration (5 minutes)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    if (!supabaseKey) {
      return new Response(
        JSON.stringify({ success: false, message: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    // Store OTP (hash the code for security)
    const encoder = new TextEncoder();
    const data = encoder.encode(otpCode);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const otpHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const { error: insertError } = await supabase
      .from("parking_otp_codes")
      .insert({
        phone_number: validatedPhoneNumber,
        otp_hash: otpHash,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error storing OTP:", insertError);
      // Continue anyway - try to send SMS
    }

    // Send SMS via Twilio (or fallback to console log for development)
    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

    let smsSent = false;
    let smsError: string | null = null;

    // Check if Twilio is configured
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      const missingSecrets = [];
      if (!TWILIO_ACCOUNT_SID) missingSecrets.push("TWILIO_ACCOUNT_SID");
      if (!TWILIO_AUTH_TOKEN) missingSecrets.push("TWILIO_AUTH_TOKEN");
      if (!TWILIO_PHONE_NUMBER) missingSecrets.push("TWILIO_PHONE_NUMBER");
      
      console.error(`Twilio not fully configured. Missing secrets: ${missingSecrets.join(", ")}`);
      smsError = `Twilio configuration incomplete. Missing: ${missingSecrets.join(", ")}`;
    } else {
      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
        const body = new URLSearchParams({
          To: validatedPhoneNumber,
          From: TWILIO_PHONE_NUMBER,
          Body: `Your NH&T Estates parking permit verification code is: ${otpCode}. This code expires in 5 minutes.`,
        });

        console.log(`Attempting to send SMS via Twilio to ${validatedPhoneNumber.substring(0, 3)}****${validatedPhoneNumber.slice(-2)}`);
        console.log(`Using Twilio phone: ${TWILIO_PHONE_NUMBER}`);

        const response = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: body.toString(),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Twilio API error response:", errorText);
          
          // Try to parse Twilio error message
          try {
            const errorJson = JSON.parse(errorText);
            const errorMessage = errorJson.message || `Twilio error: ${errorJson.code || response.status}`;
            
            // Provide helpful error messages for common issues
            if (errorMessage.includes("not SMS-capable") || errorMessage.includes("SMS-capable")) {
              smsError = `Your Twilio phone number (${TWILIO_PHONE_NUMBER}) does not support SMS. Please purchase an SMS-capable phone number from Twilio. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming`;
            } else if (errorMessage.includes("not a valid phone number")) {
              smsError = `Invalid phone number format. Please check your TWILIO_PHONE_NUMBER secret in Supabase.`;
            } else if (errorMessage.includes("unverified")) {
              smsError = `The recipient phone number must be verified in your Twilio account for trial accounts. Verify it at: https://console.twilio.com/us1/develop/phone-numbers/manage/verified`;
            } else {
              smsError = `Twilio error: ${errorMessage}`;
            }
          } catch {
            smsError = `Twilio API error (${response.status}): ${errorText.substring(0, 200)}`;
          }
        } else {
          const responseData = await response.json();
          console.log("SMS sent successfully via Twilio. Message SID:", responseData.sid);
          smsSent = true;
        }
      } catch (twilioError: any) {
        console.error("Error sending SMS via Twilio:", twilioError);
        smsError = `Failed to send SMS: ${twilioError.message || "Network error"}`;
      }
    }

    // If SMS failed, return error to user (don't silently fail)
    if (!smsSent && smsError) {
      console.error("SMS sending failed:", smsError);
      return new Response(
        JSON.stringify({
          success: false,
          message: `Failed to send verification code: ${smsError}. Please check your phone number and try again, or contact support.`,
          error: smsError,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // SECURITY FIX: Only log OTP codes in development mode (never in production)
    // Check if we're in development by checking for a DEV_MODE environment variable
    const isDevMode = Deno.env.get("DEV_MODE") === "true";
    if (isDevMode) {
      console.log(`[DEV] OTP Code for ${validatedPhoneNumber}: ${otpCode}`);
    } else {
      // Redact phone number in logs for privacy
      const redactedPhone = validatedPhoneNumber.substring(0, 3) + "****" + validatedPhoneNumber.slice(-2);
      if (smsSent) {
        console.log(`✅ OTP code sent successfully via SMS to ${redactedPhone} (code not logged in production)`);
      } else {
        console.log(`⚠️ OTP code generated but SMS not sent to ${redactedPhone}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Verification code sent successfully",
        smsSent: smsSent,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in request-parking-otp:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to send verification code",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

