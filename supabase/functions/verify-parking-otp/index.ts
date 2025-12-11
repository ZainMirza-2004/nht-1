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

  // SECURITY FIX: Rate limiting to prevent brute-force attacks
  const rateLimitResponse = checkRateLimit(req, 10, 15 * 60 * 1000); // 10 attempts per 15 minutes
  
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { phoneNumber, code } = await req.json();

    if (!phoneNumber || !code) {
      return new Response(
        JSON.stringify({ verified: false, message: "Phone number and code are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Hash the provided code
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const otpHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Verify OTP in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    if (!supabaseKey) {
      return new Response(
        JSON.stringify({ verified: false, message: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: otpRecord, error } = await supabase
      .from("parking_otp_codes")
      .select("*")
      .eq("phone_number", phoneNumber)
      .eq("otp_hash", otpHash)
      .eq("verified", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !otpRecord) {
      return new Response(
        JSON.stringify({ verified: false, message: "Invalid or expired verification code" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Mark OTP as verified
    await supabase
      .from("parking_otp_codes")
      .update({ verified: true, verified_at: new Date().toISOString() })
      .eq("id", otpRecord.id);

    // Log phone verification for anti-fraud
    await supabase
      .from("parking_phone_verifications")
      .insert({
        phone_number: phoneNumber,
        verified_at: new Date().toISOString(),
      });

    return new Response(
      JSON.stringify({
        verified: true,
        message: "Phone number verified successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in verify-parking-otp:", error);
    return new Response(
      JSON.stringify({
        verified: false,
        message: "Verification failed",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

