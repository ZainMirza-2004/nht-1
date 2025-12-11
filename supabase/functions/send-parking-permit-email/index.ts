// @ts-nocheck - This file runs in Deno runtime (Supabase Edge Functions), not Node.js
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PermitRequest {
  fullName: string;
  email: string;
  phone?: string;
  vehicleMake: string;
  registration: string;
  propertyName: string;
  permitType: 'time_slot' | 'full_day' | 'free' | 'paid';
  permitDate?: string;
  startTime?: string;
  endTime?: string;
  additionalDetails?: string;
  numberOfNights?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const data: PermitRequest = await req.json();

    // Get Supabase client
    // Try both SUPABASE_SERVICE_ROLE_KEY (standard) and SERVICE_ROLE_KEY (custom)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY") ?? "";
    
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

    // Prepare insert data - start with required fields only
    const insertData: any = {
      full_name: data.fullName,
      email: data.email,
      vehicle_make: data.vehicleMake,
      registration: data.registration,
      property_name: data.propertyName,
      status: "pending",
    };

    // Add optional fields if provided
    if (data.phone) {
      insertData.phone = data.phone;
    }
    if (data.numberOfNights) {
      insertData.number_of_nights = data.numberOfNights;
    }

    // Try to add new columns if they exist in the schema
    // If columns don't exist, these will be ignored (graceful degradation)
    try {
      // Check if we should include permit_type (only if column exists)
      // For now, we'll try to include it, but if it fails, we'll retry without it
      if (data.permitType) {
        insertData.permit_type = data.permitType;
      }
      if (data.permitDate) {
        insertData.permit_date = data.permitDate;
      }
      if (data.startTime) {
        insertData.start_time = data.startTime;
      }
      if (data.endTime) {
        insertData.end_time = data.endTime;
      }
    } catch (e) {
      // Ignore - columns might not exist
      console.log("New columns not available, using basic schema");
    }
    
    if (data.additionalDetails) {
      insertData.additional_details = data.additionalDetails;
    }

    // Store the permit request in the database
    // First try with all fields, if it fails due to missing columns, retry with basic fields only
    let permitRequest;
    let insertError;
    
    const { data: result, error: error1 } = await supabase
      .from("parking_permit_requests")
      .insert(insertData)
      .select()
      .single();
    
    permitRequest = result;
    insertError = error1;
    
    // If error is about missing columns, retry with only basic fields
    if (insertError && insertError.message && insertError.message.includes("Could not find")) {
      console.log("Retrying with basic fields only (new columns not in schema yet)");
      const basicInsertData = {
        full_name: data.fullName,
        email: data.email,
        vehicle_make: data.vehicleMake,
        registration: data.registration,
        property_name: data.propertyName,
        status: "pending",
      };
      
      if (data.additionalDetails) {
        basicInsertData.additional_details = data.additionalDetails;
      }
      
      const { data: result2, error: error2 } = await supabase
        .from("parking_permit_requests")
        .insert(basicInsertData)
        .select()
        .single();
      
      permitRequest = result2;
      insertError = error2;
      
      if (!insertError) {
        console.log("Successfully stored with basic fields. Please run migration to add time slot columns.");
      }
    }

    if (insertError) {
      console.error("Error storing permit request:", insertError);
      console.error("Insert data:", JSON.stringify(insertData, null, 2));
      return new Response(
        JSON.stringify({
          success: false,
          message: `Failed to store permit request: ${insertError.message}`,
          error: insertError.message,
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

    console.log("Parking permit request stored:", permitRequest.id);

    // Send email to property manager with approve/reject links
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const PROPERTY_MANAGER_EMAIL = Deno.env.get("PROPERTY_MANAGER_EMAIL") || "manager@nhtestates.com";
    const SUPABASE_FUNCTIONS_URL = Deno.env.get("SUPABASE_URL")?.replace("/rest/v1", "") || "";
    const TOKEN_SECRET = Deno.env.get("TOKEN_SECRET") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    let managerEmailSent = false;

    if (RESEND_API_KEY && permitRequest) {
      try {
        // Generate secure HMAC tokens for approval/rejection
        // Import token security functions
        async function generateSecureToken(permitRequestId: string, action: string, secret: string): Promise<string> {
          // Use same payload format as validation: permitRequestId:action (no timestamp)
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
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          
          const token = btoa(`${permitRequestId}:${action}:${hashHex}`)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
          
          return token;
        }

        async function generateTokenHash(token: string): Promise<string> {
          const encoder = new TextEncoder();
          const data = encoder.encode(token);
          const hashBuffer = await crypto.subtle.digest('SHA-256', data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }

        // Generate secure tokens
        const approveToken = await generateSecureToken(permitRequest.id, 'approve', TOKEN_SECRET);
        const rejectToken = await generateSecureToken(permitRequest.id, 'reject', TOKEN_SECRET);

        // Store tokens in database with expiration (24 hours)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const approveTokenHash = await generateTokenHash(approveToken);
        const rejectTokenHash = await generateTokenHash(rejectToken);

        // Insert tokens into parking_permit_tokens table
        try {
          const { error: tokenError } = await supabase.from('parking_permit_tokens').insert([
            {
              permit_request_id: permitRequest.id,
              token_hash: approveTokenHash,
              action: 'approve',
              expires_at: expiresAt.toISOString(),
            },
            {
              permit_request_id: permitRequest.id,
              token_hash: rejectTokenHash,
              action: 'reject',
              expires_at: expiresAt.toISOString(),
            },
          ]);
          
          if (tokenError) {
            console.warn("Could not store tokens in database (table might not exist yet):", tokenError.message);
            // Continue anyway - tokens are still secure
          }
        } catch (tokenErr) {
          console.warn("Could not store tokens in database (table might not exist yet):", tokenErr);
          // Continue anyway - tokens are still secure
        }

        // Generate secure approval and rejection links
        const approveLink = `${SUPABASE_FUNCTIONS_URL}/functions/v1/approve-parking-permit?token=${encodeURIComponent(approveToken)}`;
        const rejectLink = `${SUPABASE_FUNCTIONS_URL}/functions/v1/reject-parking-permit?token=${encodeURIComponent(rejectToken)}`;

        const managerEmailBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1e3a8a; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .request-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-weight: bold; color: #6b7280; }
    .detail-value { color: #111827; }
    .action-buttons { text-align: center; margin: 30px 0; }
    .approve-button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 0 10px; font-weight: bold; }
    .reject-button { display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 0 10px; font-weight: bold; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>NH&T Estates</h1>
      <p>Parking Permit Request</p>
    </div>
    <div class="content">
      <h2>New Parking Permit Request</h2>
      <p>A new parking permit request has been submitted and requires your review.</p>
      
      <div class="request-details">
        <h3 style="margin-top: 0; color: #1e3a8a;">Request Details</h3>
        <div class="detail-row">
          <span class="detail-label">Name:</span>
          <span class="detail-value">${data.fullName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email:</span>
          <span class="detail-value">${data.email}</span>
        </div>
        ${data.phone ? `
        <div class="detail-row">
          <span class="detail-label">Phone:</span>
          <span class="detail-value">${data.phone}</span>
        </div>
        ` : ''}
        <div class="detail-row">
          <span class="detail-label">Property:</span>
          <span class="detail-value">${data.propertyName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Permit Type:</span>
          <span class="detail-value">${data.permitType === 'free' ? 'Free (Driveway) - Requires Approval' : data.permitType === 'paid' ? 'Paid (On-Street)' : data.permitType === 'full_day' ? 'Full Day' : 'Time Slot'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Vehicle:</span>
          <span class="detail-value">${data.vehicleMake}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Registration:</span>
          <span class="detail-value">${data.registration}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Permit Type:</span>
          <span class="detail-value">${data.permitType === 'full_day' ? 'Full Day' : 'Time Slot'}</span>
        </div>
        ${data.permitType === 'time_slot' && data.permitDate && data.startTime && data.endTime ? `
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span class="detail-value">${new Date(data.permitDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Time:</span>
          <span class="detail-value">${data.startTime} - ${data.endTime}</span>
        </div>
        ` : data.permitType === 'full_day' && data.permitDate ? `
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span class="detail-value">${new Date(data.permitDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Duration:</span>
          <span class="detail-value">Full Day (24 hours)</span>
        </div>
        ` : ''}
        ${data.additionalDetails ? `
        <div class="detail-row">
          <span class="detail-label">Additional Details:</span>
          <span class="detail-value">${data.additionalDetails}</span>
        </div>
        ` : ''}
        <div class="detail-row">
          <span class="detail-label">Request ID:</span>
          <span class="detail-value">${permitRequest.id}</span>
        </div>
      </div>
      
      <div class="action-buttons">
        <a href="${approveLink}" class="approve-button" target="_blank">
          ✅ Approve
        </a>
        <a href="${rejectLink}" class="reject-button" target="_blank">
          ❌ Reject
        </a>
      </div>
      
      <p style="font-size: 12px; color: #6b7280; margin-top: 20px; text-align: center;">
        Click one of the buttons above to approve or reject this parking permit request. 
        The customer will receive a confirmation or rejection email automatically.
      </p>
      
      <div class="footer">
        <p>This is an automated notification from the NH&T Estates booking system.</p>
      </div>
    </div>
  </div>
</body>
</html>
        `;

        const managerEmailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "NH&T Estates <onboarding@resend.dev>",
            to: PROPERTY_MANAGER_EMAIL,
            subject: `Parking Permit Request - ${data.fullName} - ${data.propertyName}`,
            html: managerEmailBody,
          }),
        });

        const managerEmailResult = await managerEmailResponse.json();

        if (managerEmailResponse.ok && managerEmailResult.id) {
          console.log("Manager email sent successfully:", managerEmailResult.id);
          managerEmailSent = true;
        } else {
          console.error("Resend API error (manager email):", managerEmailResult);
        }
      } catch (emailError) {
        console.error("Error sending emails:", emailError);
        // Don't throw - permit request is stored even if email fails
      }
    } else {
      console.warn("RESEND_API_KEY not configured. Permit request stored but email not sent.");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: managerEmailSent
          ? "Your parking permit request has been sent successfully. Our property management team has been notified and will review your request. You will receive an email notification once your request has been approved or rejected."
          : "Your parking permit request has been sent successfully. " + (RESEND_API_KEY ? "However, the notification email to the property manager could not be sent. Your request has been stored and will be reviewed manually." : "Email service is not configured. Your request has been stored and will be reviewed manually."),
        requestId: permitRequest.id,
        managerEmailSent: managerEmailSent,
        emailConfigured: !!RESEND_API_KEY,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error processing permit request:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to process your request. Please try again.",
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
