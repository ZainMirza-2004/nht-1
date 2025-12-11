/**
 * Phone number utility functions for E.164 format handling
 * E.164 format: +[country code][number] (e.g., +441234567890)
 */

/**
 * Format a phone number to E.164 format
 * If no country code is provided, assumes UK (+44)
 * 
 * @param phone - Phone number input (can be in various formats)
 * @returns Formatted phone number in E.164 format or null if invalid
 */
export function formatPhoneToE164(phone: string): string | null {
  if (!phone) return null;

  // Remove all spaces, dashes, parentheses, and other formatting
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');

  // If already starts with +, validate E.164 format
  if (cleaned.startsWith('+')) {
    // E.164: + followed by 1-15 digits
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    if (e164Regex.test(cleaned)) {
      return cleaned;
    }
    return null; // Invalid E.164 format
  }

  // If starts with 00, replace with +
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.substring(2);
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    if (e164Regex.test(cleaned)) {
      return cleaned;
    }
    return null;
  }

  // If it's a UK number (starts with 0 or doesn't start with + or 00)
  // Remove leading 0 and add +44
  if (cleaned.startsWith('0')) {
    cleaned = '+44' + cleaned.substring(1);
  } else if (!cleaned.startsWith('+') && !cleaned.startsWith('00')) {
    // Assume UK number if no country code
    cleaned = '+44' + cleaned;
  } else {
    return null; // Invalid format
  }

  // Validate final E.164 format
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  if (e164Regex.test(cleaned)) {
    return cleaned;
  }

  return null;
}

/**
 * Format phone number for display (human-readable)
 * Converts +441234567890 to +44 1234 567890
 */
export function formatPhoneForDisplay(phone: string): string {
  if (!phone) return '';

  // If it's in E.164 format (+44...), format it nicely
  if (phone.startsWith('+44')) {
    const number = phone.substring(3); // Remove +44
    // Format UK numbers: +44 XXXX XXXXXX
    if (number.length === 10) {
      return `+44 ${number.substring(0, 4)} ${number.substring(4)}`;
    }
    return phone; // Return as-is if not standard UK length
  }

  // If it starts with + but not +44, format it
  if (phone.startsWith('+')) {
    // Format: +XX XXXX XXXX... (group by 3-4 digits)
    const match = phone.match(/^\+(\d{1,3})(\d+)$/);
    if (match) {
      const [, countryCode, number] = match;
      // Format number in groups of 3-4 digits
      const formattedNumber = number.replace(/(\d{3,4})(?=\d)/g, '$1 ');
      return `+${countryCode} ${formattedNumber}`;
    }
  }

  return phone;
}

/**
 * Validate if a phone number is in valid E.164 format
 */
export function isValidE164(phone: string): boolean {
  if (!phone) return false;
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone.replace(/[\s\-\(\)\.]/g, ''));
}

/**
 * Get phone number validation error message
 */
export function getPhoneValidationError(phone: string): string | null {
  if (!phone) {
    return 'Phone number is required';
  }

  const formatted = formatPhoneToE164(phone);
  if (!formatted) {
    return 'Please enter a valid phone number in international format (e.g., +44 1234 567890 or 01234567890 for UK)';
  }

  return null;
}

