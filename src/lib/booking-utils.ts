/**
 * Utility functions for booking time slot calculations and overlap detection
 */

export interface TimeRange {
  start: Date;
  end: Date;
}

/**
 * Get duration in minutes for a spa package
 */
export function getSpaDurationMinutes(packageType: string): number {
  switch (packageType) {
    case '1 Hour Session':
      return 60;
    case '1.5 Hour Session':
      return 90;
    case '2 Hour Premium Session':
      return 120;
    default:
      return 60; // Default to 1 hour
  }
}

/**
 * Get duration in minutes for a cinema package
 */
export function getCinemaDurationMinutes(packageType: string): number {
  switch (packageType) {
    case 'Standard Experience':
      return 180; // 3 hours
    case 'Premium Experience':
      return 360; // 6 hours
    case 'Deluxe Experience':
      return 720; // 12 hours (overnight from 8pm)
    default:
      return 180; // Default to 3 hours
  }
}

/**
 * Parse time slot string (e.g., "10:00 AM") to 24-hour format (e.g., "10:00")
 */
export function parseTimeSlot(timeSlot: string): string {
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
export function timeStringToDate(date: string, time24: string): Date {
  return new Date(`${date}T${time24}:00`);
}

/**
 * Calculate time range for a booking
 */
export function calculateBookingTimeRange(
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
export function timeRangesOverlap(range1: TimeRange, range2: TimeRange): boolean {
  return range1.start < range2.end && range2.start < range1.end;
}

/**
 * Generate all time slots that would be blocked by a booking
 * Includes the booking duration plus a 30-minute cleaning gap
 * Returns an array of time slot strings (e.g., ["10:00 AM", "11:00 AM"])
 */
export function getBlockedTimeSlots(
  bookingDate: string,
  startTimeSlot: string,
  durationMinutes: number,
  allTimeSlots: string[],
  cleaningGapMinutes: number = 30
): string[] {
  // Calculate booking range (start to end of session)
  const bookingRange = calculateBookingTimeRange(bookingDate, startTimeSlot, durationMinutes);
  
  // Add cleaning gap after the booking ends
  const cleaningGapEnd = new Date(bookingRange.end.getTime() + cleaningGapMinutes * 60 * 1000);
  const totalBlockedRange: TimeRange = {
    start: bookingRange.start,
    end: cleaningGapEnd
  };
  
  const blocked: string[] = [];
  
  for (const slot of allTimeSlots) {
    const slotTime24 = parseTimeSlot(slot);
    const slotStart = timeStringToDate(bookingDate, slotTime24);
    // Each slot is assumed to be 1 hour, so end is 1 hour later
    const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
    const slotRange: TimeRange = { start: slotStart, end: slotEnd };
    
    // Block if slot overlaps with booking + cleaning gap
    if (timeRangesOverlap(totalBlockedRange, slotRange)) {
      blocked.push(slot);
    }
  }
  
  return blocked;
}

/**
 * Check if a time slot is available given existing bookings
 * Includes 30-minute cleaning gap after each booking
 */
export function isTimeSlotAvailable(
  bookingDate: string,
  timeSlot: string,
  durationMinutes: number,
  existingBookings: Array<{ time_slot: string; package_type: string }>,
  getDurationFn: (packageType: string) => number,
  cleaningGapMinutes: number = 30
): boolean {
  const requestedRange = calculateBookingTimeRange(bookingDate, timeSlot, durationMinutes);
  
  for (const booking of existingBookings) {
    const bookingDuration = getDurationFn(booking.package_type);
    const bookingRange = calculateBookingTimeRange(
      bookingDate,
      booking.time_slot,
      bookingDuration
    );
    
    // Add cleaning gap after booking ends
    const bookingWithCleaning: TimeRange = {
      start: bookingRange.start,
      end: new Date(bookingRange.end.getTime() + cleaningGapMinutes * 60 * 1000)
    };
    
    if (timeRangesOverlap(requestedRange, bookingWithCleaning)) {
      return false;
    }
  }
  
  return true;
}

