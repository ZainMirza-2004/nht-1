// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

interface WebhookEvent {
  type: string;
  data: {
    object: {
      id: string;
      metadata?: {
        bookingId?: string;
        serviceType?: string;
        [key: string]: string | undefined;
      };
      status?: string;
      [key: string]: any;
    };
  };
}

/**
 * Helper function to update booking status in database
 */
async function updateBookingStatus(
  bookingId: string,
  serviceType: string,
  paymentIntentId: string,
  paymentStatus: 'succeeded' | 'failed',
  bookingStatus: 'paid' | 'pending'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      const errorMsg = 'Supabase configuration missing. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.';
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const tableName = serviceType === 'spa' ? 'spa_bookings' : 'cinema_bookings';
    
    const { error, data } = await supabase
      .from(tableName)
      .update({ 
        status: bookingStatus,
        payment_intent_id: paymentIntentId,
        payment_status: paymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating ${tableName} booking ${bookingId}:`, error);
      return { success: false, error: error.message };
    }

    if (!data) {
      const errorMsg = `Booking ${bookingId} not found in ${tableName}`;
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    console.log(`✅ Successfully updated booking ${bookingId} in ${tableName}: status=${bookingStatus}, payment_status=${paymentStatus}`);
    return { success: true };
  } catch (error: any) {
    const errorMsg = `Unexpected error updating booking: ${error.message}`;
    console.error(errorMsg, error);
    return { success: false, error: errorMsg };
  }
}

/**
 * Send confirmation email after payment success
 */
async function sendConfirmationEmail(
  bookingData: any,
  serviceType: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    if (!supabaseUrl) {
      console.error('❌ SUPABASE_URL not configured in webhook, cannot send email');
      return { success: false, error: 'Supabase URL not configured' };
    }

    // Get anon key for calling the email function
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!anonKey) {
      console.error('❌ SUPABASE_ANON_KEY not configured in webhook secrets, cannot send email');
      console.error('⚠️ Please add SUPABASE_ANON_KEY to Supabase Edge Functions secrets');
      return { success: false, error: 'Supabase anon key not configured' };
    }

    console.log(`📧 Attempting to send confirmation email for booking ${bookingData.id} (${serviceType})`);
    // Redact email for privacy (only show first 2 chars and domain)
    const redactedEmail = bookingData.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
    console.log(`📧 Email recipient: ${redactedEmail}`);

    // Map database fields to email function format
    const emailPayload: any = {
      serviceType: serviceType,
      bookingId: bookingData.id,
      fullName: bookingData.full_name,
      email: bookingData.email,
      phone: bookingData.phone || '',
      bookingDate: bookingData.booking_date,
      timeSlot: bookingData.time_slot,
      packageType: bookingData.package_type || '',
      packagePrice: bookingData.package_price || 0,
    };

    // Add experience tier if available
    if (bookingData.experience_tier) {
      emailPayload.experienceTier = bookingData.experience_tier;
    }

    console.log(`📧 Calling email function: ${supabaseUrl}/functions/v1/send-booking-confirmation`);
    // Redact email in payload logging for privacy
    const sanitizedPayload = { ...emailPayload, email: emailPayload.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') };
    console.log(`📧 Email payload (sanitized):`, JSON.stringify(sanitizedPayload, null, 2));

    const emailUrl = `${supabaseUrl}/functions/v1/send-booking-confirmation`;
    const response = await fetch(emailUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    const responseText = await response.text();
    console.log(`📧 Email function response status: ${response.status}`);
    console.log(`📧 Email function response: ${responseText}`);

    if (!response.ok) {
      console.error('❌ Failed to send confirmation email:', responseText);
      return { success: false, error: `Email failed: ${responseText}` };
    }

    console.log('✅ Confirmation email sent successfully');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error sending confirmation email:', error);
    console.error('❌ Error stack:', error.stack);
    return { success: false, error: error.message };
  }
}

/**
 * Handle payment_intent.succeeded event
 */
async function handlePaymentSucceeded(event: WebhookEvent): Promise<{ success: boolean; error?: string }> {
  const paymentIntent = event.data.object;
  const bookingId = paymentIntent.metadata?.bookingId;
  const serviceType = paymentIntent.metadata?.serviceType;

  if (!bookingId || !serviceType) {
    const errorMsg = `Missing required metadata: bookingId=${bookingId}, serviceType=${serviceType}`;
    console.warn(`⚠️ ${errorMsg} for payment_intent ${paymentIntent.id}`);
    return { success: false, error: errorMsg };
  }

  console.log(`💰 Processing payment success for booking ${bookingId} (${serviceType})`);
  
  // Update booking status first
  const updateResult = await updateBookingStatus(
    bookingId,
    serviceType,
    paymentIntent.id,
    'succeeded',
    'paid'
  );

  if (!updateResult.success) {
    return updateResult;
  }

  // Fetch booking data to send email
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY');
    
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const tableName = serviceType === 'spa' ? 'spa_bookings' : 'cinema_bookings';
      
      const { data: bookingData, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', bookingId)
        .single();

      if (!fetchError && bookingData) {
        // Send confirmation email (don't fail webhook if email fails)
        const emailResult = await sendConfirmationEmail(bookingData, serviceType);
        if (!emailResult.success) {
          console.warn(`⚠️ Email sending failed but booking updated: ${emailResult.error}`);
        }
      } else {
        console.warn(`⚠️ Could not fetch booking data for email: ${fetchError?.message}`);
      }
    }
  } catch (emailError: any) {
    console.warn(`⚠️ Error sending email (non-critical): ${emailError.message}`);
  }

  return updateResult;
}

/**
 * Handle payment_intent.payment_failed event
 */
async function handlePaymentFailed(event: WebhookEvent): Promise<{ success: boolean; error?: string }> {
  const paymentIntent = event.data.object;
  const bookingId = paymentIntent.metadata?.bookingId;
  const serviceType = paymentIntent.metadata?.serviceType;

  if (!bookingId || !serviceType) {
    const errorMsg = `Missing required metadata: bookingId=${bookingId}, serviceType=${serviceType}`;
    console.warn(`⚠️ ${errorMsg} for payment_intent ${paymentIntent.id}`);
    return { success: false, error: errorMsg };
  }

  console.log(`❌ Processing payment failure for booking ${bookingId} (${serviceType})`);
  return await updateBookingStatus(
    bookingId,
    serviceType,
    paymentIntent.id,
    'failed',
    'pending' // Keep booking as pending so user can retry payment
  );
}

// FIX: Updated to use Deno.serve pattern consistent with other Edge Functions
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Only POST requests are accepted.' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Get environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    // Validate required configuration
    if (!stripeSecretKey) {
      const errorMsg = 'STRIPE_SECRET_KEY not configured in Supabase Edge Functions secrets';
      console.error(`❌ ${errorMsg}`);
      return new Response(
        JSON.stringify({ error: errorMsg }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Webhook secret is REQUIRED for security
    if (!webhookSecret) {
      const errorMsg = 'STRIPE_WEBHOOK_SECRET not configured. Webhook signature verification is required for security.';
      console.error(`❌ ${errorMsg}`);
      return new Response(
        JSON.stringify({ 
          error: errorMsg,
          hint: 'Please add STRIPE_WEBHOOK_SECRET to Supabase Edge Functions secrets. Get it from Stripe Dashboard → Webhooks → Your endpoint → Signing secret'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Import Stripe
    const Stripe = (await import('https://esm.sh/stripe@14.21.0')).default;
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-11-20.acacia',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Get the signature from headers (required for webhook verification)
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      const errorMsg = 'Missing stripe-signature header. This endpoint should only be called by Stripe.';
      console.error(`❌ ${errorMsg}`);
      return new Response(
        JSON.stringify({ error: errorMsg }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get the raw body (must be text for signature verification)
    const body = await req.text();

    // Verify webhook signature
    let event: WebhookEvent;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret) as WebhookEvent;
      console.log(`✅ Webhook signature verified for event: ${event.type}`);
    } catch (err: any) {
      const errorMsg = `Webhook signature verification failed: ${err.message}`;
      console.error(`❌ ${errorMsg}`);
      return new Response(
        JSON.stringify({ 
          error: errorMsg,
          hint: 'This could indicate the webhook secret is incorrect or the request is not from Stripe.'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle different event types
    let result: { success: boolean; error?: string } | null = null;

    switch (event.type) {
      case 'payment_intent.succeeded':
        result = await handlePaymentSucceeded(event);
        break;

      case 'payment_intent.payment_failed':
        result = await handlePaymentFailed(event);
        break;

      default:
        // Log unhandled events but don't fail (Stripe may send other events)
        console.log(`ℹ️ Received unhandled event type: ${event.type}`);
        return new Response(
          JSON.stringify({ 
            received: true,
            message: `Event type ${event.type} received but not handled`
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
    }

    // Check if event handling was successful
    if (result && !result.success) {
      console.error(`❌ Failed to process ${event.type}: ${result.error}`);
      // Still return 200 to Stripe (we don't want them to retry for our errors)
      // But log the error for monitoring
      return new Response(
        JSON.stringify({ 
          received: true,
          processed: false,
          error: result.error
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Success response
    return new Response(
      JSON.stringify({ 
        received: true,
        processed: true,
        event_type: event.type
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    // Unexpected error
    console.error('❌ Unexpected webhook error:', error);
    return new Response(
      JSON.stringify({
        error: 'Webhook processing failed',
        message: error.message || 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

