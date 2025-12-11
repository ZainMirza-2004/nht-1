// @ts-nocheck - This file runs in Deno runtime (Supabase Edge Functions)
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ParkingPermitRequest {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  vehicle_make: string;
  registration: string;
  property_name: string;
  permit_type: string;
  permit_date?: string;
  start_time?: string;
  end_time?: string;
  number_of_nights?: number;
  permit_id?: string;
  status: string;
  additional_details?: string;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  rejected_at?: string;
  check_in_date?: string;
  check_out_date?: string;
  transaction_id?: string;
  amount_paid?: number;
}

/**
 * Generate Excel file using xlsx library
 * Using esm.sh CDN which works with Deno
 */
async function generateExcelFile(bookings: ParkingPermitRequest[]): Promise<Uint8Array> {
  try {
    // Import xlsx library for Deno via esm.sh
    const XLSX = await import("https://esm.sh/xlsx@0.18.5");
    
    // Prepare worksheet data
    const worksheetData: any[] = [];
    
    // Add header row
    const headers = [
      "Booking ID",
      "Permit ID",
      "Full Name",
      "Email",
      "Phone",
      "Vehicle Make",
      "Registration",
      "Property Name",
      "Permit Type",
      "Number of Nights",
      "Check-in Date",
      "Check-out Date",
      "Permit Date",
      "Start Time",
      "End Time",
      "Status",
      "Transaction ID",
      "Amount Paid",
      "Additional Details",
      "Created At",
      "Updated At",
      "Approved At",
      "Rejected At",
    ];
    worksheetData.push(headers);
    
    // Add data rows
    for (const booking of bookings) {
      const row = [
        booking.id || "",
        booking.permit_id || "",
        booking.full_name || "",
        booking.email || "",
        booking.phone || "",
        booking.vehicle_make || "",
        booking.registration || "",
        booking.property_name || "",
        booking.permit_type || "",
        booking.number_of_nights?.toString() || "",
        booking.check_in_date || "",
        booking.check_out_date || "",
        booking.permit_date || "",
        booking.start_time || "",
        booking.end_time || "",
        booking.status || "",
        booking.transaction_id || "",
        booking.amount_paid?.toString() || "",
        booking.additional_details || "",
        booking.created_at ? new Date(booking.created_at).toLocaleString() : "",
        booking.updated_at ? new Date(booking.updated_at).toLocaleString() : "",
        booking.approved_at ? new Date(booking.approved_at).toLocaleString() : "",
        booking.rejected_at ? new Date(booking.rejected_at).toLocaleString() : "",
      ];
      worksheetData.push(row);
    }
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Set column widths for better readability
    const colWidths = [
      { wch: 36 }, // Booking ID
      { wch: 20 }, // Permit ID
      { wch: 25 }, // Full Name
      { wch: 30 }, // Email
      { wch: 15 }, // Phone
      { wch: 20 }, // Vehicle Make
      { wch: 15 }, // Registration
      { wch: 30 }, // Property Name
      { wch: 15 }, // Permit Type
      { wch: 15 }, // Number of Nights
      { wch: 15 }, // Check-in Date
      { wch: 15 }, // Check-out Date
      { wch: 15 }, // Permit Date
      { wch: 12 }, // Start Time
      { wch: 12 }, // End Time
      { wch: 12 }, // Status
      { wch: 30 }, // Transaction ID
      { wch: 15 }, // Amount Paid
      { wch: 40 }, // Additional Details
      { wch: 20 }, // Created At
      { wch: 20 }, // Updated At
      { wch: 20 }, // Approved At
      { wch: 20 }, // Rejected At
    ];
    ws['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(wb, ws, "Weekly Bookings");
    
    // Generate Excel file buffer
    const excelBuffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    return new Uint8Array(excelBuffer);
  } catch (error) {
    console.error("Error generating Excel file:", error);
    throw new Error(`Failed to generate Excel file: ${error.message}`);
  }
}

/**
 * Format date range for filename
 */
function getDateRangeForFilename(): string {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 7);
  
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  
  return `${formatDate(startDate)}_to_${formatDate(endDate)}`;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? 
                               Deno.env.get("SERVICE_ROLE_KEY") ?? "";
    const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";
    const propertyManagerEmail = Deno.env.get("PROPERTY_MANAGER_EMAIL") ?? "";

    // Validate required configuration
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server configuration error: Missing Supabase credentials",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!resendApiKey || !propertyManagerEmail) {
      console.error("Missing email configuration");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server configuration error: Missing email configuration (RESEND_API_KEY or PROPERTY_MANAGER_EMAIL)",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate date range (last 7 days including today)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 6); // -6 gives us 7 days total (including today)
    
    // Format dates for PostgreSQL query
    const startDateISO = startDate.toISOString();
    const endDateISO = endDate.toISOString();

    console.log(`Querying bookings from ${startDateISO} to ${endDateISO}`);

    // Query bookings from the last 7 days
    const { data: bookings, error: queryError } = await supabase
      .from("parking_permit_requests")
      .select("*")
      .gte("created_at", startDateISO)
      .lte("created_at", endDateISO)
      .order("created_at", { ascending: false });

    if (queryError) {
      console.error("Database query error:", queryError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Database query failed: ${queryError.message}`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const bookingsList: ParkingPermitRequest[] = bookings || [];
    console.log(`Found ${bookingsList.length} bookings in the last 7 days`);

    // Prepare email content
    const dateRange = getDateRangeForFilename();
    const fileName = `parking_report_${dateRange}.xlsx`;
    
    let emailSubject = "Weekly Parking Booking Report";
    let emailBody = "Attached is the weekly booking report containing all reservations made within the past 7 days.";
    let excelFile: Uint8Array | null = null;

    // Generate Excel file if there are bookings
    if (bookingsList.length > 0) {
      try {
        excelFile = await generateExcelFile(bookingsList);
        console.log(`Excel file generated successfully (${excelFile.length} bytes)`);
      } catch (excelError) {
        console.error("Error generating Excel file:", excelError);
        return new Response(
          JSON.stringify({
            success: false,
            error: `Failed to generate Excel file: ${excelError.message}`,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else {
      // No bookings this week
      emailBody = "No bookings were made this week. There are no reservations to report for the past 7 days.";
      console.log("No bookings found for the week");
    }

    // Send email with attachment (if file exists)
    try {
      const emailPayload: any = {
        from: "NH&T Estates <onboarding@resend.dev>",
        to: propertyManagerEmail,
        subject: emailSubject,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #1e3a8a; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>NH&T Estates</h1>
                <p>Weekly Parking Booking Report</p>
              </div>
              <div class="content">
                <p>${emailBody}</p>
                ${bookingsList.length > 0 ? `<p><strong>Total bookings:</strong> ${bookingsList.length}</p>` : ''}
                <div class="footer">
                  <p>This is an automated weekly report from the NH&T Estates booking system.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      // Add attachment if Excel file was generated
      if (excelFile && bookingsList.length > 0) {
        // Convert Uint8Array to base64 for Resend API
        // Use a more efficient method for large files
        let binaryString = '';
        const chunkSize = 8192; // Process in chunks to avoid stack overflow
        for (let i = 0; i < excelFile.length; i += chunkSize) {
          const chunk = excelFile.slice(i, i + chunkSize);
          binaryString += String.fromCharCode.apply(null, Array.from(chunk));
        }
        const base64Content = btoa(binaryString);
        
        emailPayload.attachments = [
          {
            filename: fileName,
            content: base64Content,
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          },
        ];
      }

      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailPayload),
      });

      const emailResult = await emailResponse.json();

      if (!emailResponse.ok) {
        console.error("Resend API error:", emailResult);
        return new Response(
          JSON.stringify({
            success: false,
            error: `Failed to send email: ${emailResult.message || "Unknown error"}`,
            resendError: emailResult,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log("Email sent successfully:", emailResult.id);

      return new Response(
        JSON.stringify({
          success: true,
          message: bookingsList.length > 0
            ? `Weekly report sent successfully with ${bookingsList.length} bookings`
            : "Weekly report sent successfully (no bookings this week)",
          bookingsCount: bookingsList.length,
          dateRange: {
            start: startDateISO,
            end: endDateISO,
          },
          emailId: emailResult.id,
          fileName: bookingsList.length > 0 ? fileName : null,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to send email: ${emailError.message}`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Unexpected error in weekly-report:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: `Unexpected error: ${error.message}`,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

