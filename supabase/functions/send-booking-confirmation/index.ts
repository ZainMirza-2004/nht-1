// @ts-nocheck - This file runs in Deno runtime (Supabase Edge Functions), not Node.js
// TypeScript errors here are expected and can be ignored - the code works correctly when deployed
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface BookingConfirmationRequest {
  serviceType: 'spa' | 'cinema';
  bookingId: string;
  fullName: string;
  email: string;
  phone: string;
  bookingDate: string;
  timeSlot: string;
  packageType: string;
  packagePrice: number;
  experienceTier?: 'standard' | 'premium' | 'deluxe'; // New tier field
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const data: BookingConfirmationRequest = await req.json();
    const {
      serviceType,
      bookingId,
      fullName,
      email,
      phone,
      bookingDate,
      timeSlot,
      packageType,
      packagePrice,
      experienceTier,
    } = data;
    
    // Get tier display name
    const getTierDisplayName = (tier?: string) => {
      if (!tier) return packageType; // Fallback to packageType if tier not provided
      const tierNames: Record<string, string> = {
        standard: 'Standard Experience',
        premium: 'Premium Experience',
        deluxe: 'Deluxe Experience',
      };
      return tierNames[tier] || tier.charAt(0).toUpperCase() + tier.slice(1) + ' Experience';
    };
    
    const tierDisplayName = getTierDisplayName(experienceTier);

    // Format the date nicely
    const dateObj = new Date(bookingDate);
    const formattedDate = dateObj.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Helper function to generate .ics file content
    const generateICSFile = (startDate: string, startTime: string, durationMinutes: number, title: string, description: string, location: string = 'NH&T Estates'): string => {
      try {
        const [year, month, day] = startDate.split('-').map(Number);
        const timeParts = startTime.replace(/\s*(AM|PM)\s*/i, '').split(':');
        let hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1] || '0', 10);
        
        if (startTime.toUpperCase().includes('PM') && hours !== 12) {
          hours += 12;
        } else if (startTime.toUpperCase().includes('AM') && hours === 12) {
          hours = 0;
        }
        
        const start = new Date(Date.UTC(year, month - 1, day, hours, minutes));
        const end = new Date(start.getTime() + durationMinutes * 60000);
        
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

    // Helper function to generate Google Calendar link
    const generateCalendarLink = (startDate: string, startTime: string, durationMinutes: number, title: string, description: string) => {
      try {
        // Parse date and time
        const [year, month, day] = startDate.split('-').map(Number);
        const timeParts = startTime.replace(/\s*(AM|PM)\s*/i, '').split(':');
        let hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1] || '0', 10);
        
        // Handle 12-hour format
        if (startTime.toUpperCase().includes('PM') && hours !== 12) {
          hours += 12;
        } else if (startTime.toUpperCase().includes('AM') && hours === 12) {
          hours = 0;
        }
        
        // Create start datetime (local time)
        const start = new Date(year, month - 1, day, hours, minutes);
        const end = new Date(start.getTime() + durationMinutes * 60000);
        
        // Format for Google Calendar (YYYYMMDDTHHmmss) - local time format
        // Google Calendar will handle timezone conversion
        const formatDate = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const mins = String(date.getMinutes()).padStart(2, '0');
          const secs = String(date.getSeconds()).padStart(2, '0');
          return `${year}${month}${day}T${hours}${mins}${secs}`;
        };
        
        const params = new URLSearchParams({
          action: 'TEMPLATE',
          text: title,
          dates: `${formatDate(start)}/${formatDate(end)}`,
          details: description.replace(/\n/g, '%0A'),
          location: 'NH&T Estates',
        });
        
        return `https://calendar.google.com/calendar/render?${params.toString()}`;
      } catch (error) {
        console.error("Error generating calendar link:", error);
        // Return a basic calendar link without dates if generation fails
        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(description)}&location=NH&T Estates`;
      }
    };

    // Calculate duration based on experience tier (preferred) or package type (fallback)
    let durationMinutes = 120; // Default 2 hours
    if (experienceTier) {
      // Use tier-based duration calculation (more reliable)
      if (serviceType === 'spa') {
        if (experienceTier === 'standard') {
          durationMinutes = 60; // 1 hour
        } else if (experienceTier === 'premium') {
          durationMinutes = 90; // 1.5 hours
        } else if (experienceTier === 'deluxe') {
          durationMinutes = 120; // 2 hours
        }
      } else if (serviceType === 'cinema') {
        if (experienceTier === 'standard') {
          durationMinutes = 120; // 2 hours
        } else if (experienceTier === 'premium') {
          durationMinutes = 180; // 3 hours
        } else if (experienceTier === 'deluxe') {
          durationMinutes = 240; // 4 hours
        }
      }
    } else {
      // Fallback to package type if tier not provided
      if (serviceType === 'spa') {
        if (packageType === '1 Hour Session' || packageType.includes('Standard')) {
          durationMinutes = 60;
        } else if (packageType === '1.5 Hour Session' || packageType.includes('Premium')) {
          durationMinutes = 90;
        } else if (packageType === '2 Hour Premium Session' || packageType.includes('Deluxe')) {
          durationMinutes = 120;
        }
      } else if (serviceType === 'cinema') {
        if (packageType === 'Standard Experience' || packageType.includes('Standard')) {
          durationMinutes = 120; // 2 hours
        } else if (packageType === 'Premium Experience' || packageType.includes('Premium')) {
          durationMinutes = 180; // 3 hours
        } else if (packageType === 'Deluxe Experience' || packageType.includes('Deluxe')) {
          durationMinutes = 240; // 4 hours
        }
      }
    }

    // Generate calendar links and .ics file for customer
    const serviceName = serviceType === 'spa' ? 'Spa & Wellness' : 'Private Cinema';
    const customerEventTitle = `${serviceName} Booking - ${tierDisplayName} - NH&T Estates`;
    const customerEventDescription = `Booking Details:\nService: ${serviceName}\nExperience Tier: ${tierDisplayName}\nPackage: ${packageType}\nDate: ${formattedDate}\nTime: ${timeSlot}\nPrice: £${packagePrice}\nBooking ID: ${bookingId}\n\nContact:\nEmail: info@nhtestates.com\nPhone: +44 1234 567890`;
    
    const customerCalendarLink = generateCalendarLink(
      bookingDate,
      timeSlot,
      durationMinutes,
      customerEventTitle,
      customerEventDescription
    );
    
    // Generate .ics file content
    const customerICSContent = generateICSFile(
      bookingDate,
      timeSlot,
      durationMinutes,
      customerEventTitle,
      customerEventDescription,
      'NH&T Estates'
    );
    
    // Create data URL for .ics download
    const customerICSDataURL = customerICSContent 
      ? `data:text/calendar;charset=utf-8;base64,${btoa(unescape(encodeURIComponent(customerICSContent)))}`
      : '';

    // Create email content
    const subject = `Booking Confirmation - ${serviceName} - NH&T Estates`;
    
    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1e3a8a; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-weight: bold; color: #6b7280; }
    .detail-value { color: #111827; }
    .calendar-button { display: inline-block; background: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>NH&T Estates</h1>
      <p>Booking Confirmation</p>
    </div>
    <div class="content">
      <h2>Dear ${fullName},</h2>
      <p>Thank you for your booking! We're delighted to confirm your reservation.</p>
      
      <div class="booking-details">
        <h3 style="margin-top: 0; color: #1e3a8a;">Booking Details</h3>
        <div class="detail-row">
          <span class="detail-label">Service:</span>
          <span class="detail-value">${serviceName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Experience Tier:</span>
          <span class="detail-value">${tierDisplayName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Package:</span>
          <span class="detail-value">${packageType}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span class="detail-value">${formattedDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Time:</span>
          <span class="detail-value">${timeSlot}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Location:</span>
          <span class="detail-value">${serviceType === 'spa' ? 'CF24 3AF, 16, The Walk' : 'CF24 3AF, 16, The Cinema'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Price:</span>
          <span class="detail-value">£${packagePrice}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Booking ID:</span>
          <span class="detail-value">${bookingId}</span>
        </div>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${customerCalendarLink}" style="display: inline-block; background: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 5px;" target="_blank">
          📅 Add to Google Calendar
        </a>
        ${customerICSDataURL ? `
        <a href="${customerICSDataURL}" download="booking.ics" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 5px;">
          📥 Download .ics File
        </a>
        ` : ''}
      </div>
      
      <p style="font-size: 12px; color: #6b7280; text-align: center; margin-top: 20px;">
        Click "Add to Google Calendar" for Google Calendar, or "Download .ics File" for Outlook, Apple Calendar, and other calendar apps.
      </p>
      
      <p>We look forward to welcoming you. If you have any questions or need to make changes to your booking, please don't hesitate to contact us.</p>
      
      <p><strong>Contact Information:</strong><br>
      Email: info@nhtestates.com<br>
      Phone: +44 1234 567890</p>
      
      <div class="footer">
        <p>Best regards,<br>The NH&T Estates Team</p>
        <p style="font-size: 12px; margin-top: 20px;">
          This is an automated confirmation email. Please do not reply to this message.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

    // Try to send email using Resend (if configured)
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const PROPERTY_MANAGER_EMAIL = Deno.env.get("PROPERTY_MANAGER_EMAIL") || "manager@nhtestates.com";
    let emailSent = false;
    let managerEmailSent = false;
    
    if (RESEND_API_KEY) {
      try {
        // Redact email for privacy (only show first 2 chars and domain)
        const redactedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
        console.log("Attempting to send email via Resend to:", redactedEmail);
        
        // Send confirmation email to customer
        const resendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "NH&T Estates <onboarding@resend.dev>",
            to: email,
            subject: subject,
            html: emailBody,
          }),
        });
        
        const resendResult = await resendResponse.json();
        
        if (resendResponse.ok && resendResult.id) {
          emailSent = true;
          console.log("Customer email sent successfully via Resend:", resendResult.id);
        } else {
          console.error("Resend API error (customer email):", resendResult);
        }
      } catch (resendError) {
        console.error("Error calling Resend API (customer email):", resendError);
      }

      // Wait 1 second before sending manager email to avoid Resend rate limit (2 requests/second)
      // This prevents "rate_limit_exceeded" errors
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Send notification email to property manager with calendar link
      try {
        // Use the same durationMinutes calculated earlier for customer calendar link
        const managerEventTitle = `${serviceName} Booking - ${tierDisplayName} - ${fullName}`;
        const managerEventDescription = `Booking Details:\nService: ${serviceName}\nExperience Tier: ${tierDisplayName}\nPackage: ${packageType}\nCustomer: ${fullName}\nEmail: ${email}\nPhone: ${phone}\nBooking ID: ${bookingId}`;
        
        const managerCalendarLink = generateCalendarLink(
          bookingDate,
          timeSlot,
          durationMinutes,
          managerEventTitle,
          managerEventDescription
        );
        
        // Generate .ics file for manager
        const managerICSContent = generateICSFile(
          bookingDate,
          timeSlot,
          durationMinutes,
          managerEventTitle,
          managerEventDescription,
          'NH&T Estates'
        );
        
        const managerICSDataURL = managerICSContent 
          ? `data:text/calendar;charset=utf-8;base64,${btoa(unescape(encodeURIComponent(managerICSContent)))}`
          : '';
        
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
    .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-weight: bold; color: #6b7280; }
    .detail-value { color: #111827; }
    .calendar-buttons { text-align: center; margin: 30px 0; }
    .calendar-button { display: inline-block; background: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 5px; }
    .ics-button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 5px; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
    .notice { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 12px; margin: 20px 0; border-radius: 4px; }
    .status-badge { display: inline-block; background: #10b981; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>NH&T Estates</h1>
      <p>New Booking Notification</p>
    </div>
    <div class="content">
      <h2>New ${serviceName} Booking Confirmed</h2>
      <p>A new ${serviceName.toLowerCase()} booking has been confirmed and payment has been received. Please ensure all arrangements are in place for this booking.</p>
      
      <div class="notice">
        <strong>Action Required:</strong> Please prepare the ${serviceName === 'Spa & Wellness' ? 'spa facilities' : 'cinema'} for this booking and ensure staff are aware of the scheduled appointment.
      </div>
      
      <div class="booking-details">
        <h3 style="margin-top: 0; color: #1e3a8a;">Booking Information</h3>
        <div class="detail-row">
          <span class="detail-label">Service Type:</span>
          <span class="detail-value"><strong>${serviceName}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Experience Tier:</span>
          <span class="detail-value">${tierDisplayName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Package:</span>
          <span class="detail-value">${packageType}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Duration:</span>
          <span class="detail-value">${Math.floor(durationMinutes / 60)} ${Math.floor(durationMinutes / 60) === 1 ? 'hour' : 'hours'}${durationMinutes % 60 > 0 ? ` ${durationMinutes % 60} minutes` : ''}</span>
        </div>
        <div style="margin: 20px 0; padding: 15px; background: #f3f4f6; border-radius: 6px;">
          <h4 style="margin-top: 0; color: #1e3a8a; font-size: 16px;">Customer Details</h4>
          <div class="detail-row">
            <span class="detail-label">Name:</span>
            <span class="detail-value"><strong>${fullName}</strong></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Email:</span>
            <span class="detail-value">${email}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Phone:</span>
            <span class="detail-value">${phone || 'Not provided'}</span>
          </div>
        </div>
        <div style="margin: 20px 0; padding: 15px; background: #fef3c7; border-radius: 6px;">
          <h4 style="margin-top: 0; color: #1e3a8a; font-size: 16px;">Appointment Details</h4>
          <div class="detail-row">
            <span class="detail-label">Date:</span>
            <span class="detail-value"><strong>${formattedDate}</strong></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Time:</span>
            <span class="detail-value"><strong>${timeSlot}</strong></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Location:</span>
            <span class="detail-value"><strong>${serviceType === 'spa' ? 'CF24 3AF, 16, The Walk' : 'CF24 3AF, 16, The Cinema'}</strong></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">End Time (approx.):</span>
            <span class="detail-value">${(() => {
              const [year, month, day] = bookingDate.split('-').map(Number);
              const timeParts = timeSlot.replace(/\s*(AM|PM)\s*/i, '').split(':');
              let hours = parseInt(timeParts[0], 10);
              const minutes = parseInt(timeParts[1] || '0', 10);
              if (timeSlot.toUpperCase().includes('PM') && hours !== 12) hours += 12;
              if (timeSlot.toUpperCase().includes('AM') && hours === 12) hours = 0;
              const start = new Date(year, month - 1, day, hours, minutes);
              const end = new Date(start.getTime() + durationMinutes * 60000);
              return end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
            })()}</span>
          </div>
        </div>
        <div class="detail-row">
          <span class="detail-label">Amount Paid:</span>
          <span class="detail-value"><strong style="color: #10b981;">£${packagePrice.toFixed(2)}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Payment Status:</span>
          <span class="detail-value"><span class="status-badge">PAID</span></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Booking Reference:</span>
          <span class="detail-value" style="font-family: monospace; font-size: 12px;">${bookingId}</span>
        </div>
      </div>
      
      <div class="calendar-buttons">
        <a href="${managerCalendarLink}" class="calendar-button" target="_blank">
          📅 Add to Google Calendar
        </a>
        ${managerICSDataURL ? `
        <a href="${managerICSDataURL}" download="booking-${bookingId}.ics" class="ics-button">
          📥 Download .ics File
        </a>
        ` : ''}
      </div>
      
      <p style="font-size: 12px; color: #6b7280; text-align: center; margin-top: 20px;">
        Click "Add to Google Calendar" for Google Calendar, or "Download .ics File" for Outlook, Apple Calendar, and other calendar apps.
      </p>
      
      <div class="footer">
        <p><strong>This is an automated notification from the NH&T Estates booking system.</strong></p>
        <p style="font-size: 12px; margin-top: 10px;">Please ensure this booking is noted in your calendar and all necessary preparations are made.</p>
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
            subject: `New ${serviceName} Booking - ${fullName} - ${formattedDate}`,
            html: managerEmailBody,
          }),
        });
        
        const managerEmailResult = await managerEmailResponse.json();
        
        if (managerEmailResponse.ok && managerEmailResult.id) {
          managerEmailSent = true;
          console.log("Manager email sent successfully via Resend:", managerEmailResult.id);
        } else {
          console.error("Resend API error (manager email):", managerEmailResult);
        }
      } catch (managerEmailError) {
        console.error("Error calling Resend API (manager email):", managerEmailError);
      }
    } else {
      console.warn("RESEND_API_KEY not configured. Email not sent. Configure Resend API key in Supabase Edge Functions secrets to enable email sending.");
      // Sanitize email payload before logging
      const sanitizedEmailPayload = {
        to: email ? email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : email,
        subject: subject,
        bookingId: bookingId,
      };
      console.log("Email that would be sent (sanitized):", sanitizedEmailPayload);
    }
    
    // If email service is not configured, we still return success
    // because the booking itself was successful
    // The email can be sent manually or configured later

    // Return response with clear indication of email status
    return new Response(
      JSON.stringify({
        success: true,
        message: emailSent 
          ? "Confirmation email sent successfully" 
          : "Booking confirmed. Email service not configured.",
        emailSent: emailSent,
        managerEmailSent: managerEmailSent,
        emailConfigured: !!RESEND_API_KEY,
        note: emailSent ? undefined : "To enable email sending, configure RESEND_API_KEY in Supabase Edge Functions secrets. See EMAIL_SETUP_COMPLETE.md for instructions.",
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
    console.error("Error sending confirmation email:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Failed to send confirmation email";
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
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

