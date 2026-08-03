/**
 * In-memory rate limiter for Next.js API routes.
 * Uses a sliding-window counter per IP address.
 * Persists across hot-reloads via global cache.
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const globalStore = global as any;
if (!globalStore.__rateLimitStore) {
  globalStore.__rateLimitStore = new Map<string, RateLimitEntry>();
}

const store: Map<string, RateLimitEntry> = globalStore.__rateLimitStore;

/**
 * Check whether an IP is within the allowed rate limit.
 * @param ip  - Caller IP address
 * @param key - A unique route key (e.g. "company-login")
 * @param maxRequests - Maximum requests allowed per window
 * @param windowMs - Window duration in milliseconds
 * @returns true if the request should be allowed, false if rate-limited
 */
export function checkRateLimit(
  ip: string,
  key: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const storeKey = `${key}:${ip}`;
  const now = Date.now();
  const entry = store.get(storeKey);

  if (!entry || now - entry.windowStart > windowMs) {
    // New window
    store.set(storeKey, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false; // Rate limited
  }

  entry.count += 1;
  store.set(storeKey, entry);
  return true;
}

/**
 * Extract the real client IP from a Next.js Request.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "127.0.0.1"
  );
}

/**
 * Pre-defined rate limit profiles.
 */
export const RATE_LIMITS = {
  LOGIN: { maxRequests: 10, windowMs: 60_000 },         // 10 per minute
  REGISTER: { maxRequests: 5, windowMs: 3_600_000 },    // 5 per hour
  FORGOT_PASSWORD: { maxRequests: 3, windowMs: 600_000 }, // 3 per 10 minutes
  TALENT_SEARCH: { maxRequests: 30, windowMs: 60_000 },  // 30 per minute
} as const;
