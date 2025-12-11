/**
 * Simple rate limiting utility for Supabase Edge Functions
 * Uses in-memory storage (resets on function restart)
 * For production, consider using Redis or Supabase database
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

const store: RateLimitStore = {};

interface RateLimitOptions {
  maxRequests?: number; // Default: 100
  windowMs?: number; // Default: 60000 (1 minute)
  keyGenerator?: (req: Request) => string; // Default: uses IP address
}

/**
 * Rate limit middleware
 * Returns null if allowed, or a Response with 429 status if rate limited
 */
export function rateLimit(
  req: Request,
  options: RateLimitOptions = {}
): Response | null {
  const {
    maxRequests = 100,
    windowMs = 60000, // 1 minute
    keyGenerator = (req) => {
      // Try to get IP from various headers
      const forwarded = req.headers.get("x-forwarded-for");
      const realIp = req.headers.get("x-real-ip");
      const cfConnectingIp = req.headers.get("cf-connecting-ip");
      return forwarded?.split(",")[0] || realIp || cfConnectingIp || "unknown";
    },
  } = options;

  const key = keyGenerator(req);
  const now = Date.now();
  const record = store[key];

  // Clean up old entries periodically (simple cleanup)
  if (Object.keys(store).length > 10000) {
    for (const k in store) {
      if (store[k].resetAt < now) {
        delete store[k];
      }
    }
  }

  // Check if record exists and is still valid
  if (record && record.resetAt > now) {
    if (record.count >= maxRequests) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Please try again later.",
          retryAfter: Math.ceil((record.resetAt - now) / 1000),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": Math.ceil((record.resetAt - now) / 1000).toString(),
            "X-RateLimit-Limit": maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(record.resetAt).toISOString(),
          },
        }
      );
    }
    record.count++;
  } else {
    // Create new record or reset expired one
    store[key] = {
      count: 1,
      resetAt: now + windowMs,
    };
  }

  const currentRecord = store[key];
  const remaining = Math.max(0, maxRequests - currentRecord.count);

  // Add rate limit headers to response (will be added by caller)
  return null; // Allowed
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(
  req: Request,
  options: RateLimitOptions = {}
): Record<string, string> {
  const {
    maxRequests = 100,
    keyGenerator = (req) => {
      const forwarded = req.headers.get("x-forwarded-for");
      const realIp = req.headers.get("x-real-ip");
      const cfConnectingIp = req.headers.get("cf-connecting-ip");
      return forwarded?.split(",")[0] || realIp || cfConnectingIp || "unknown";
    },
  } = options;

  const key = keyGenerator(req);
  const record = store[key];
  const remaining = record
    ? Math.max(0, maxRequests - record.count)
    : maxRequests;
  const reset = record?.resetAt
    ? new Date(record.resetAt).toISOString()
    : new Date(Date.now() + 60000).toISOString();

  return {
    "X-RateLimit-Limit": maxRequests.toString(),
    "X-RateLimit-Remaining": remaining.toString(),
    "X-RateLimit-Reset": reset,
  };
}

