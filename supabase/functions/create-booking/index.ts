// @ts-nocheck - This file runs in Deno runtime (Supabase Edge Functions), not Node.js
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Simple rate limiting (in-memory, resets on restart)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 50; // requests per window
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  return forwarded?.split(",")[0] || realIp || cfConnectingIp || "unknown";
}

function checkRateLimit(req: Request): Response | null {
  const ip = getClientIp(req);
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  // Clean up old entries
  if (rateLimitStore.size > 10000) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }
  }

  if (record && record.resetAt > now) {
    if (record.count >= RATE_LIMIT_MAX) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Rate limit exceeded. Please try again later.",
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
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  }

  return null;
}

function log(level: string, message: string, data?: any) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    function: "create-booking",
    message,
    ...(data && { data }),
  };
  console.log(JSON.stringify(logEntry));
}

interface BookingRequest {
  serviceType: 'spa' | 'cinema';
  full_name: string;
  email: string;
  phone: string;
  booking_date: string;
  time_slot: string;
  package_type: string;
  package_price: number;
  experience_tier?: 'standard' | 'premium' | 'deluxe';
  cleaning_gap_minutes?: number; // Default 30 minutes
}

/**
 * Get duration in minutes for a spa package
 */
function getSpaDurationMinutes(packageType: string): number {
  switch (packageType) {
    case '1 Hour Session':
      return 60;
    case '1.5 Hour Session':
      return 90;
    case '2 Hour Premium Session':
      return 120;
    default:
      return 60;
  }
}

/**
 * Get duration in minutes for a cinema package
 */
function getCinemaDurationMinutes(packageType: string): number {
  switch (packageType) {
    case 'Standard Experience':
      return 120;
    case 'Premium Experience':
      return 180;
    case 'Deluxe Experience':
      return 240;
    default:
      return 120;
  }
}

/**
 * Parse time slot string (e.g., "10:00 AM") to 24-hour format (e.g., "10:00")
 */
function parseTimeSlot(timeSlot: string): string {
  const [time, period] = timeSlot.split(' ');
  const [hours, minutes] = time.split(':');
  let hour24 = parseInt(hours, 10);
  
  if (period === 'PM' && hour24 !== 12) {
    hour24 += 12;
  } else if (period === 'AM' && hour24 === 12) {
    hour24 = 0;
  }
  
  return `${hour24.toString().padStart(2, '0')}:${minutes}`;
}

/**
 * Convert 24-hour time string to Date object for a given date
 */
function timeStringToDate(date: string, time24: string): Date {
  return new Date(`${date}T${time24}:00`);
}

/**
 * Calculate time range for a booking
 */
interface TimeRange {
  start: Date;
  end: Date;
}

function calculateBookingTimeRange(
  bookingDate: string,
  timeSlot: string,
  durationMinutes: number
): TimeRange {
  const time24 = parseTimeSlot(timeSlot);
  const start = timeStringToDate(bookingDate, time24);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  
  return { start, end };
}

/**
 * Check if two time ranges overlap
 */
function timeRangesOverlap(range1: TimeRange, range2: TimeRange): boolean {
  return range1.start < range2.end && range2.start < range1.end;
}

Deno.serve(async (req: Request) => {
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // Rate limiting
  const rateLimitResponse = checkRateLimit(req);
  if (rateLimitResponse) {
    log("WARN", "Rate limit exceeded", { requestId, ip: getClientIp(req) });
    return rateLimitResponse;
  }

  log("INFO", "Booking request received", { requestId, method: req.method });

  try {
    const data: BookingRequest = await req.json();
    const { 
      serviceType, 
      full_name,
      email,
      phone,
      booking_date,
      time_slot,
      package_type,
      package_price,
      experience_tier,
      cleaning_gap_minutes = 30
    } = data;

    // Validate required fields
    if (!full_name || !email || !phone || !booking_date || !time_slot || !package_type || package_price === undefined) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields",
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

    // Validate email format
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid email format",
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

    // Validate price matches tier (server-side validation)
    if (experience_tier) {
      const expectedPrices: Record<string, number> = {
        standard: 75,
        premium: 120,
        deluxe: 180,
      };
      if (package_price !== expectedPrices[experience_tier]) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Price does not match experience tier",
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
    }

    // Get Supabase client with service role for function calls
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY") ?? "";
    
    if (!supabaseServiceKey) {
      throw new Error("Service role key not configured");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Use atomic database function for booking creation (handles concurrency and validation)
    const functionName = serviceType === 'spa' ? 'create_spa_booking' : 'create_cinema_booking';
    
    const { data: result, error: functionError } = await supabase.rpc(functionName, {
      p_full_name: full_name,
      p_email: email,
      p_phone: phone,
      p_booking_date: booking_date,
      p_time_slot: time_slot,
      p_package_type: package_type,
      p_package_price: package_price,
      p_experience_tier: experience_tier || null,
      p_cleaning_gap_minutes: cleaning_gap_minutes,
    });

    if (functionError) {
      throw functionError;
    }

    // Parse result from database function
    const bookingResult = result as { success: boolean; data?: any; error?: string; message?: string };

    if (!bookingResult.success) {
      log("WARN", "Booking creation failed", {
        requestId,
        error: bookingResult.error,
        serviceType: data.serviceType,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: bookingResult.error || "Failed to create booking",
        }),
        {
          status: bookingResult.error?.includes('no longer available') ? 409 : 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    log("INFO", "Booking created successfully", {
      requestId,
      bookingId: bookingResult.data?.id,
      serviceType: data.serviceType,
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: bookingResult.data,
        message: bookingResult.message || "Booking confirmed successfully.",
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
    log("ERROR", "Error creating booking", {
      requestId,
      error: error.message,
      stack: error.stack,
    });
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to create booking. Please try again.",
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

