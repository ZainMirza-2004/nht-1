// @ts-nocheck - This file runs in Deno runtime (Supabase Edge Functions), not Node.js
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
  "Access-Control-Allow-Credentials": "true",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // Handle GET requests from email links with secure tokens
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid request. Token is required.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Get Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY") ?? "";
    const TOKEN_SECRET = Deno.env.get("TOKEN_SECRET") || supabaseKey;
    
    if (!supabaseKey) {
      console.error("Service role key not found. Please set SUPABASE_SERVICE_ROLE_KEY or SERVICE_ROLE_KEY in Edge Functions secrets.");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Server configuration error. Please contact support.",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate secure token
    async function validateSecureToken(token: string, secret: string): Promise<{ valid: boolean; permitRequestId?: string; action?: 'approve' | 'reject' }> {
      try {
        const decoded = atob(token.replace(/-/g, '+').replace(/_/g, '/'));
        const [permitRequestId, action, hashHex] = decoded.split(':');
        
        if (!permitRequestId || !action || !hashHex || (action !== 'approve' && action !== 'reject')) {
          return { valid: false };
        }
        
        const payload = `${permitRequestId}:${action}`;
        const encoder = new TextEncoder();
        const data = encoder.encode(payload);
        const key = encoder.encode(secret);
        
        const cryptoKey = await crypto.subtle.importKey(
          'raw',
          key,
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        
        const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
        const hashArray = Array.from(new Uint8Array(signature));
        const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        if (computedHash !== hashHex) {
          return { valid: false };
        }
        
        return {
          valid: true,
          permitRequestId,
          action: action as 'approve' | 'reject',
        };
      } catch (error) {
        return { valid: false };
      }
    }

    async function generateTokenHash(token: string): Promise<string> {
      const encoder = new TextEncoder();
      const data = encoder.encode(token);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Validate token
    const tokenValidation = await validateSecureToken(token, TOKEN_SECRET);
    
    if (!tokenValidation.valid || tokenValidation.action !== 'reject') {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid or expired token. Please use the link from your email.",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const permitRequestId = tokenValidation.permitRequestId!;

    // Check token in database (if table exists)
    let tokenRecord = null;
    try {
      const tokenHash = await generateTokenHash(token);
      const { data } = await supabase
        .from("parking_permit_tokens")
        .select("*")
        .eq("token_hash", tokenHash)
        .eq("action", "reject")
        .single();
      tokenRecord = data;
    } catch (err) {
      // Table might not exist yet, continue without database check
      console.log("Token table check skipped (table might not exist):", err);
    }

    if (tokenRecord) {
      // Check if token is expired
      if (new Date(tokenRecord.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "This link has expired. Please contact support.",
          }),
          {
            status: 401,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Check if token already used
      if (tokenRecord.used_at) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "This link has already been used.",
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      // Mark token as used
      await supabase
        .from("parking_permit_tokens")
        .update({ used_at: new Date().toISOString() })
        .eq("id", tokenRecord.id)
        .catch(() => {}); // Ignore errors if table doesn't exist
    }

    // Fetch the permit request
    const { data: permitRequest, error: fetchError } = await supabase
      .from("parking_permit_requests")
      .select("*")
      .eq("id", permitRequestId)
      .single();

    if (fetchError || !permitRequest) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Parking permit request not found.",
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (permitRequest.status !== "pending") {
      return new Response(
        JSON.stringify({
          success: false,
          message: `This parking permit request has already been ${permitRequest.status}.`,
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Update the permit request status
    const { error: updateError } = await supabase
      .from("parking_permit_requests")
      .update({
        status: "rejected",
        rejected_at: new Date().toISOString(),
      })
      .eq("id", permitRequestId);

    if (updateError) {
      console.error("Error updating permit request:", updateError);
      throw updateError;
    }

    // Send rejection email to customer
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (RESEND_API_KEY) {
      try {
        const rejectionEmailBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ef4444; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .request-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-weight: bold; color: #6b7280; }
    .detail-value { color: #111827; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Parking Permit Request</h1>
    </div>
    <div class="content">
      <h2>Dear ${permitRequest.full_name},</h2>
      <p>We regret to inform you that your parking permit request has been declined at this time.</p>
      
      <div class="request-details">
        <h3 style="margin-top: 0; color: #ef4444;">Request Details</h3>
        <div class="detail-row">
          <span class="detail-label">Property:</span>
          <span class="detail-value">${permitRequest.property_name}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Vehicle:</span>
          <span class="detail-value">${permitRequest.vehicle_make}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Registration:</span>
          <span class="detail-value">${permitRequest.registration}</span>
        </div>
        ${permitRequest.permit_date ? `
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span class="detail-value">${new Date(permitRequest.permit_date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        ` : ''}
        ${permitRequest.permit_type === 'time_slot' && permitRequest.start_time && permitRequest.end_time ? `
        <div class="detail-row">
          <span class="detail-label">Time:</span>
          <span class="detail-value">${permitRequest.start_time} - ${permitRequest.end_time}</span>
        </div>
        ` : permitRequest.permit_type === 'full_day' ? `
        <div class="detail-row">
          <span class="detail-label">Duration:</span>
          <span class="detail-value">Full Day (24 hours)</span>
        </div>
        ` : ''}
      </div>
      
      <p>We apologize for any inconvenience this may cause. If you have any questions or would like to discuss alternative parking arrangements, please don't hesitate to contact us.</p>
      
      <p><strong>Contact Information:</strong><br>
      Email: info@nhtestates.com<br>
      Phone: +44 1234 567890</p>
      
      <p>Our team is available to assist you with any questions or concerns you may have.</p>
      
      <div class="footer">
        <p>Best regards,<br>The NH&T Estates Team</p>
        <p style="font-size: 12px; margin-top: 20px;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
        `;

        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "NH&T Estates <onboarding@resend.dev>",
            to: permitRequest.email,
            subject: "Parking Permit Request - NH&T Estates",
            html: rejectionEmailBody,
          }),
        });

        const emailResult = await emailResponse.json();
        if (emailResponse.ok && emailResult.id) {
          console.log("Rejection email sent to customer:", emailResult.id);
        } else {
          console.error("Error sending rejection email:", emailResult);
        }
      } catch (emailError) {
        console.error("Error sending rejection email:", emailError);
      }
    }

    // Return success page
    return new Response(
      `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Parking Permit Rejected</title>
  <style>
    body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f3f4f6; }
    .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
    .reject-icon { font-size: 64px; margin-bottom: 20px; }
    h1 { color: #ef4444; margin: 0 0 20px 0; }
    p { color: #6b7280; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="reject-icon">❌</div>
    <h1>Parking Permit Rejected</h1>
    <p>The parking permit request has been rejected and a notification email has been sent to the customer.</p>
    <p style="margin-top: 20px; font-size: 14px; color: #9ca3af;">You can close this window.</p>
  </div>
</body>
</html>
      `,
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/html",
        },
      }
    );
  } catch (error) {
    console.error("Error rejecting permit:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to reject parking permit. Please try again.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

