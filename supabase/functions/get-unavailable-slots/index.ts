// @ts-nocheck - This file runs in Deno runtime (Supabase Edge Functions), not Node.js
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface UnavailableSlotsRequest {
  serviceType: 'spa' | 'cinema';
  bookingDate: string;
  allTimeSlots: string[];
  cleaningGapMinutes?: number; // Default 30 minutes
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
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const data: UnavailableSlotsRequest = await req.json();
    const { serviceType, bookingDate, allTimeSlots, cleaningGapMinutes = 30 } = data;

    // Get Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get duration function based on service type
    const getDurationFn = serviceType === 'spa' 
      ? getSpaDurationMinutes 
      : getCinemaDurationMinutes;

    // Fetch all existing bookings for this date (use view for better security)
    const viewName = serviceType === 'spa' ? 'spa_bookings_availability' : 'cinema_bookings_availability';
    const { data: existingBookings, error } = await supabase
      .from(viewName)
      .select('time_slot, package_type')
      .eq('booking_date', bookingDate);

    if (error) {
      throw error;
    }

    // Calculate which time slots are blocked by existing bookings (including cleaning gap)
    const unavailableSlots = new Set<string>();
    
    for (const booking of existingBookings || []) {
      const bookingDuration = getDurationFn(booking.package_type);
      const bookingRange = calculateBookingTimeRange(
        bookingDate,
        booking.time_slot,
        bookingDuration
      );
      
      // Add cleaning gap to booking end time
      const bookingEndWithCleaning = new Date(
        bookingRange.end.getTime() + cleaningGapMinutes * 60 * 1000
      );
      const bookingRangeWithCleaning: TimeRange = {
        start: bookingRange.start,
        end: bookingEndWithCleaning,
      };
      
      // Check each time slot to see if it overlaps with this booking (including cleaning gap)
      for (const slot of allTimeSlots) {
        const slotTime24 = parseTimeSlot(slot);
        const slotStart = timeStringToDate(bookingDate, slotTime24);
        // Each slot is assumed to be 1 hour, so end is 1 hour later
        const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
        const slotRange: TimeRange = { start: slotStart, end: slotEnd };
        
        if (timeRangesOverlap(bookingRangeWithCleaning, slotRange)) {
          unavailableSlots.add(slot);
        }
      }
    }

    return new Response(
      JSON.stringify({
        unavailableSlots: Array.from(unavailableSlots),
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
    console.error("Error getting unavailable slots:", error);
    
    return new Response(
      JSON.stringify({
        unavailableSlots: [],
        error: error.message || "Failed to get unavailable slots",
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

