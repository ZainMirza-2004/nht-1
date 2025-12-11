/**
 * Generate .ics (iCalendar) file content for calendar events
 * Provides universal calendar compatibility
 */

export interface CalendarEvent {
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
  organizerEmail?: string;
  organizerName?: string;
}

/**
 * Generate .ics file content
 */
export function generateICSFile(event: CalendarEvent): string {
  const formatDate = (date: Date): string => {
    // Format as UTC: YYYYMMDDTHHmmssZ
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  };

  const escapeText = (text: string): string => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  };

  const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@nhtestates.com`;
  const now = new Date();

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NH&T Estates//Booking System//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatDate(now)}`,
    `DTSTART:${formatDate(event.startDate)}`,
    `DTEND:${formatDate(event.endDate)}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    `LOCATION:${escapeText(event.location)}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    event.organizerEmail ? `ORGANIZER;CN=${escapeText(event.organizerName || 'NH&T Estates')}:MAILTO:${event.organizerEmail}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(line => line !== '') // Remove empty lines
    .join('\r\n');

  return ics;
}

/**
 * Generate data URL for .ics file download
 */
export function generateICSDataURL(event: CalendarEvent): string {
  const icsContent = generateICSFile(event);
  const base64 = btoa(unescape(encodeURIComponent(icsContent)));
  return `data:text/calendar;charset=utf-8;base64,${base64}`;
}

