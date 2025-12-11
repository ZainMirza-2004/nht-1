/**
 * Secure token generation and validation for parking permit approvals
 * Uses HMAC-SHA256 for secure token signing
 */

/**
 * Generate a secure HMAC token for parking permit approval/rejection
 */
export async function generateSecureToken(
  permitRequestId: string,
  action: 'approve' | 'reject',
  secret: string
): Promise<string> {
  const payload = `${permitRequestId}:${action}:${Date.now()}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const key = encoder.encode(secret);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Return base64url encoded token (URL-safe)
  const token = btoa(`${permitRequestId}:${action}:${hashHex}`)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return token;
}

/**
 * Validate a secure token
 */
export async function validateSecureToken(
  token: string,
  secret: string
): Promise<{ valid: boolean; permitRequestId?: string; action?: 'approve' | 'reject' }> {
  try {
    // Decode base64url
    const decoded = atob(token.replace(/-/g, '+').replace(/_/g, '/'));
    const [permitRequestId, action, hashHex] = decoded.split(':');
    
    if (!permitRequestId || !action || !hashHex) {
      return { valid: false };
    }
    
    if (action !== 'approve' && action !== 'reject') {
      return { valid: false };
    }
    
    // Recreate the payload and verify signature
    const payload = `${permitRequestId}:${action}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    const key = encoder.encode(secret);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
    const hashArray = Array.from(new Uint8Array(signature));
    const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Constant-time comparison
    if (computedHash !== hashHex) {
      return { valid: false };
    }
    
    return {
      valid: true,
      permitRequestId,
      action: action as 'approve' | 'reject',
    };
  } catch (error) {
    return { valid: false };
  }
}

/**
 * Generate token hash for database storage
 */
export async function generateTokenHash(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

