import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PermitRequest {
  fullName: string;
  email: string;
  vehicleMake: string;
  registration: string;
  propertyName: string;
  additionalDetails?: string;
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

    console.log("Parking permit request received:", {
      fullName: data.fullName,
      email: data.email,
      vehicleMake: data.vehicleMake,
      registration: data.registration,
      propertyName: data.propertyName,
      additionalDetails: data.additionalDetails || 'None'
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Your parking permit request has been sent successfully."
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
        message: "Failed to process your request. Please try again."
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