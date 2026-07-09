/**
 * Token Bucket Rate Limiter
 * Implements: tokens(t) = min(C, tokens(t-1) + r * Delta_t)
 */
export class TokenBucketLimiter {
  private capacity: number;
  private refillRatePerMs: number; // Refill rate normalized to tokens per millisecond
  private buckets: Map<string, { tokens: number; lastRefill: number }> = new Map();

  constructor(capacity: number, refillRatePerSec: number) {
    this.capacity = capacity;
    this.refillRatePerMs = refillRatePerSec / 1000;
  }

  /**
   * Attempts to consume standard tokens from the bucket associated with `key`.
   * Returns true if consumption is allowed, false if rate limited.
   */
  public tryConsume(key: string, cost: number = 1): boolean {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      // Lazy initialize bucket full of tokens
      bucket = { tokens: this.capacity, lastRefill: now };
    } else {
      // Refill calculation: tokens refilled = rate * time elapsed
      const elapsedMs = now - bucket.lastRefill;
      const refilledTokens = bucket.tokens + elapsedMs * this.refillRatePerMs;
      
      bucket.tokens = Math.min(this.capacity, refilledTokens);
      bucket.lastRefill = now;
    }

    if (bucket.tokens >= cost) {
      bucket.tokens -= cost;
      this.buckets.set(key, bucket);
      return true;
    }

    // Rate limited! Save current state (updated timestamp so tokens accumulate correctly)
    this.buckets.set(key, bucket);
    return false;
  }

  /**
   * Cleans up idle buckets to prevent memory leaks in memory-intensive environments
   */
  public prune(idleTimeoutMs: number = 3600000): void {
    const now = Date.now();
    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRefill > idleTimeoutMs) {
        this.buckets.delete(key);
      }
    }
  }
}

// Global Limiter Configurations
export const messageLimiter = new TokenBucketLimiter(15, 3); // Burst: 15 messages, Refill: 3 messages/sec
export const searchLimiter = new TokenBucketLimiter(5, 0.5); // Burst: 5 searches, Refill: 0.5 searches/sec (highly restrictive against scrapers)
export const authLimiter = new TokenBucketLimiter(5, 0.2);   // Burst: 5 login/signup tries, Refill: 1 try per 5 sec
