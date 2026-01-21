
// Simple in-memory rate limiter for serverless functions.
// Note: This is per-instance and will be reset on cold starts.
// For a production-grade shared rate limit, use Vercel KV or Upstash.

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 10; // 10 requests per hour per IP

export function isRateLimited(ip: string): { limited: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const userData = rateLimitMap.get(ip) || { count: 0, lastReset: now };

  if (now - userData.lastReset > WINDOW_MS) {
    userData.count = 0;
    userData.lastReset = now;
  }

  if (userData.count >= MAX_REQUESTS) {
    return {
      limited: true,
      remaining: 0,
      reset: userData.lastReset + WINDOW_MS
    };
  }

  userData.count += 1;
  rateLimitMap.set(ip, userData);

  return {
    limited: false,
    remaining: MAX_REQUESTS - userData.count,
    reset: userData.lastReset + WINDOW_MS
  };
}
