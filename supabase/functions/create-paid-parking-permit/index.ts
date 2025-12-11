// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function generatePermitId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `PP-${timestamp}-${random}`.toUpperCase();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const data = await req.json();

    // SECURITY: Validate and sanitize input data
    if (!data.fullName || !data.email || !data.permitDate) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing required fields: fullName, email, and permitDate are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate email format
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(data.email)) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid email format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate permit date
    const permitDate = new Date(data.permitDate);
    if (isNaN(permitDate.getTime())) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid permit date format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate number of nights
    const numberOfNights = parseInt(data.numberOfNights) || 1;
    if (numberOfNights < 1 || numberOfNights > 365) {
      return new Response(
        JSON.stringify({ success: false, message: "Number of nights must be between 1 and 365" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Sanitize and limit text field lengths
    const fullName = data.fullName.trim().substring(0, 100);
    const email = data.email.trim().toLowerCase();
    const vehicleMake = data.vehicleMake?.trim().substring(0, 50) || null;
    const registration = data.registration?.trim().substring(0, 20).toUpperCase().replace(/\s+/g, '') || null;
    const propertyName = data.propertyName?.trim().substring(0, 100) || null;

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

    // Generate unique permit ID
    const permitId = generatePermitId();

    // Create permit record with sanitized data
    const { data: permit, error: insertError } = await supabase
      .from("parking_permit_requests")
      .insert({
        full_name: fullName,
        email: email,
        phone: data.phone || null,
        vehicle_make: vehicleMake,
        registration: registration,
        property_name: propertyName,
        permit_type: "paid",
        permit_date: permitDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
        number_of_nights: numberOfNights,
        permit_id: permitId,
        status: "approved", // Paid permits are auto-approved
        approved_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating permit:", insertError);
      return new Response(
        JSON.stringify({ success: false, message: "Failed to create permit" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Send emails
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const PROPERTY_MANAGER_EMAIL = Deno.env.get("PROPERTY_MANAGER_EMAIL") || "manager@nhtestates.com";

    if (RESEND_API_KEY) {
      try {
        // Customer email
        const customerEmailBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .permit-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .permit-id { background: #1e3a8a; color: white; padding: 15px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; }
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
      <h1>✅ Parking Permit Confirmed</h1>
    </div>
    <div class="content">
      <h2>Dear ${data.fullName},</h2>
      <p>Your paid parking permit has been successfully created!</p>
      
      <div class="permit-id">${permitId}</div>
      
      <div class="permit-details">
        <h3 style="margin-top: 0; color: #10b981;">Permit Details</h3>
        <div class="detail-row">
          <span class="detail-label">Property:</span>
          <span class="detail-value">${data.propertyName}</span>
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
          <span class="detail-label">Date:</span>
          <span class="detail-value">${new Date(data.permitDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Number of Nights:</span>
          <span class="detail-value">${data.numberOfNights}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Permit Type:</span>
          <span class="detail-value">Paid On-Street Parking</span>
        </div>
      </div>
      
      <p style="margin-top: 20px;">Please keep this email for your records. Your permit is valid for the dates specified above.</p>
      
      <div class="footer">
        <p>This is an automated confirmation from NH&T Estates.</p>
      </div>
    </div>
  </div>
</body>
</html>
        `;

        const customerEmailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "NH&T Estates <onboarding@resend.dev>",
            to: data.email,
            subject: `Parking Permit Confirmed - ${permitId}`,
            html: customerEmailBody,
          }),
        });

        const customerEmailResult = await customerEmailResponse.json();
        if (customerEmailResponse.ok && customerEmailResult.id) {
          console.log("Customer email sent successfully:", customerEmailResult.id);
        } else {
          console.error("Resend API error (customer email):", customerEmailResult);
        }

        // Wait 1 second before sending manager email to avoid Resend rate limit (2 requests/second)
        // This prevents "rate_limit_exceeded" errors
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Helper functions for calendar links (same as send-booking-confirmation)
        const generateCalendarLink = (startDate: string, durationDays: number, title: string, description: string) => {
          try {
            const [year, month, day] = startDate.split('-').map(Number);
            const start = new Date(year, month - 1, day, 0, 0);
            const end = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000);
            
            const formatDate = (date: Date) => {
              const y = date.getFullYear();
              const m = String(date.getMonth() + 1).padStart(2, '0');
              const d = String(date.getDate()).padStart(2, '0');
              const h = String(date.getHours()).padStart(2, '0');
              const min = String(date.getMinutes()).padStart(2, '0');
              return `${y}${m}${d}T${h}${min}00`;
            };
            
            const params = new URLSearchParams({
              action: 'TEMPLATE',
              text: title,
              dates: `${formatDate(start)}/${formatDate(end)}`,
              details: description.replace(/\n/g, '%0A'),
              location: data.propertyName || 'NH&T Estates',
            });
            
            return `https://calendar.google.com/calendar/render?${params.toString()}`;
          } catch (error) {
            console.error("Error generating calendar link:", error);
            return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(data.propertyName || 'NH&T Estates')}`;
          }
        };

        const generateICSFile = (startDate: string, durationDays: number, title: string, description: string, location: string) => {
          try {
            const [year, month, day] = startDate.split('-').map(Number);
            const start = new Date(Date.UTC(year, month - 1, day, 0, 0));
            const end = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000);
            
            const formatDate = (date: Date): string => {
              const y = date.getUTCFullYear();
              const m = String(date.getUTCMonth() + 1).padStart(2, '0');
              const d = String(date.getUTCDate()).padStart(2, '0');
              const h = String(date.getUTCHours()).padStart(2, '0');
              const min = String(date.getUTCMinutes()).padStart(2, '0');
              const s = String(date.getUTCSeconds()).padStart(2, '0');
              return `${y}${m}${d}T${h}${min}${s}Z`;
            };
            
            const escapeText = (text: string): string => {
              return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
            };
            
            const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@nhtestates.com`;
            const now = new Date();
            
            return [
              'BEGIN:VCALENDAR',
              'VERSION:2.0',
              'PRODID:-//NH&T Estates//Booking System//EN',
              'CALSCALE:GREGORIAN',
              'METHOD:PUBLISH',
              'BEGIN:VEVENT',
              `UID:${uid}`,
              `DTSTAMP:${formatDate(now)}`,
              `DTSTART:${formatDate(start)}`,
              `DTEND:${formatDate(end)}`,
              `SUMMARY:${escapeText(title)}`,
              `DESCRIPTION:${escapeText(description)}`,
              `LOCATION:${escapeText(location)}`,
              'STATUS:CONFIRMED',
              'SEQUENCE:0',
              'END:VEVENT',
              'END:VCALENDAR',
            ].join('\r\n');
          } catch (error) {
            console.error("Error generating .ics file:", error);
            return '';
          }
        };

        const permitDate = new Date(data.permitDate);
        const formattedDate = permitDate.toLocaleDateString('en-GB', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        const managerEventTitle = `Parking Permit - ${data.fullName} - ${data.propertyName}`;
        const managerEventDescription = `Parking Permit Details:\nPermit ID: ${permitId}\nCustomer: ${data.fullName}\nEmail: ${data.email}\nPhone: ${data.phone || 'N/A'}\nProperty: ${data.propertyName}\nVehicle: ${data.vehicleMake}\nRegistration: ${data.registration}\nDate: ${formattedDate}\nNumber of Nights: ${data.numberOfNights}\nStatus: Approved (Paid)`;

        const managerCalendarLink = generateCalendarLink(
          data.permitDate,
          data.numberOfNights,
          managerEventTitle,
          managerEventDescription
        );

        const managerICSContent = generateICSFile(
          data.permitDate,
          data.numberOfNights,
          managerEventTitle,
          managerEventDescription,
          data.propertyName || 'NH&T Estates'
        );

        const managerICSDataURL = managerICSContent 
          ? `data:text/calendar;charset=utf-8;base64,${btoa(unescape(encodeURIComponent(managerICSContent)))}`
          : '';

        // Manager notification email
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
    .permit-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-weight: bold; color: #6b7280; }
    .detail-value { color: #111827; }
    .calendar-buttons { text-align: center; margin: 30px 0; }
    .calendar-button { display: inline-block; background: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 5px; }
    .ics-button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 5px; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    .notice { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>NH&T Estates</h1>
      <p>New Paid Parking Permit</p>
    </div>
    <div class="content">
      <h2>New Paid Parking Permit Created</h2>
      <p>A new paid parking permit has been automatically approved and created. Payment has been received and the permit is now active.</p>
      
      <div class="notice">
        <strong>Action Required:</strong> Please note this permit in your records and ensure parking arrangements are in place for the specified dates.
      </div>
      
      <div class="permit-details">
        <h3 style="margin-top: 0; color: #1e3a8a;">Permit Details</h3>
        <div class="detail-row">
          <span class="detail-label">Permit ID:</span>
          <span class="detail-value"><strong>${permitId}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Customer Name:</span>
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
          <span class="detail-label">Vehicle Make & Model:</span>
          <span class="detail-value">${data.vehicleMake}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Registration Number:</span>
          <span class="detail-value"><strong>${data.registration}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Permit Start Date:</span>
          <span class="detail-value">${formattedDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Duration:</span>
          <span class="detail-value">${data.numberOfNights} ${data.numberOfNights === 1 ? 'night' : 'nights'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Status:</span>
          <span class="detail-value"><strong style="color: #10b981;">Approved (Paid)</strong></span>
        </div>
      </div>
      
      <div class="calendar-buttons">
        <a href="${managerCalendarLink}" class="calendar-button" target="_blank">
          📅 Add to Google Calendar
        </a>
        ${managerICSDataURL ? `
        <a href="${managerICSDataURL}" download="parking-permit-${permitId}.ics" class="ics-button">
          📥 Download .ics File
        </a>
        ` : ''}
      </div>
      
      <p style="font-size: 12px; color: #6b7280; text-align: center; margin-top: 20px;">
        Click "Add to Google Calendar" for Google Calendar, or "Download .ics File" for Outlook, Apple Calendar, and other calendar apps.
      </p>
      
      <div class="footer">
        <p>This is an automated notification from the NH&T Estates booking system.</p>
        <p style="font-size: 12px; margin-top: 10px;">Please ensure this permit is noted in your records.</p>
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
            subject: `Paid Parking Permit - ${permitId} - ${data.fullName}`,
            html: managerEmailBody,
          }),
        });

        const managerEmailResult = await managerEmailResponse.json();
        if (managerEmailResponse.ok && managerEmailResult.id) {
          console.log("Manager email sent successfully:", managerEmailResult.id);
        } else {
          console.error("Resend API error (manager email):", managerEmailResult);
        }
      } catch (emailError) {
        console.error("Error sending emails:", emailError);
        // Don't fail the request if email fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        permitId: permitId,
        id: permit.id, // Return database ID for confirmation page
        message: "Parking permit created successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in create-paid-parking-permit:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to create permit",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});


