/**
 * Client-Side Rate Limiter
 * ============================================================================
 * This is a UX-layer guard, NOT a security control (the browser controls the
 * browser; a real attacker bypasses this trivially).  The authoritative rate
 * limits live on the Express backend (express-rate-limit).
 *
 * What this DOES provide:
 *   • Prevents accidental rapid-fire API calls from double-clicks / React
 *     strict-mode double-effects / aggressive retry logic.
 *   • Gives the user a clear "please wait" message before the backend returns
 *     a 429, which improves perceived responsiveness.
 *
 * Usage:
 *   const limiter = createRateLimiter({ maxCalls: 5, windowMs: 60_000 });
 *
 *   // Before a sensitive call:
 *   if (!limiter.allow()) {
 *     toast({ title: "Please wait", description: limiter.retryMessage() });
 *     return;
 *   }
 */

export interface RateLimiterOptions {
  /** Maximum number of calls allowed within the time window. */
  maxCalls: number;
  /** Rolling window duration in milliseconds. Default: 60 000 (1 minute). */
  windowMs?: number;
}

export interface RateLimiter {
  /** Returns true if a call is allowed, false if it should be blocked. */
  allow(): boolean;
  /** Human-readable hint about when the next call will be permitted. */
  retryMessage(): string;
  /** Reset the counter (e.g. on component unmount). */
  reset(): void;
}

/**
 * Creates an in-memory sliding-window rate limiter.
 * Each call to `allow()` records a timestamp; old timestamps outside the window
 * are pruned before checking the count.
 */
export const createRateLimiter = ({
  maxCalls,
  windowMs = 60_000,
}: RateLimiterOptions): RateLimiter => {
  const timestamps: number[] = [];

  const prune = () => {
    const cutoff = Date.now() - windowMs;
    while (timestamps.length > 0 && timestamps[0] < cutoff) {
      timestamps.shift();
    }
  };

  return {
    allow() {
      prune();
      if (timestamps.length >= maxCalls) return false;
      timestamps.push(Date.now());
      return true;
    },

    retryMessage() {
      prune();
      if (timestamps.length === 0) return "You can try now.";
      const oldest = timestamps[0];
      const retryAt = oldest + windowMs;
      const secsLeft = Math.ceil((retryAt - Date.now()) / 1000);
      return `Too many attempts. Please wait ${secsLeft}s before trying again.`;
    },

    reset() {
      timestamps.length = 0;
    },
  };
};

// ---------------------------------------------------------------------------
// Pre-built limiters for each sensitive action (mirrors backend limits)
// ---------------------------------------------------------------------------

/** Coupon validation – 10 per 15 min (matches backend) */
export const couponLimiter = createRateLimiter({ maxCalls: 10, windowMs: 15 * 60_000 });

/** Payment order creation – 20 per 15 min */
export const orderLimiter = createRateLimiter({ maxCalls: 20, windowMs: 15 * 60_000 });

/** Payment verification – 30 per 15 min */
export const verifyLimiter = createRateLimiter({ maxCalls: 30, windowMs: 15 * 60_000 });

/** Auth actions (login / register) – 10 per 15 min */
export const authLimiter = createRateLimiter({ maxCalls: 10, windowMs: 15 * 60_000 });
