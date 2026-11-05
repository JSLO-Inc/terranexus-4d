/**
 * TERRANEXUS 4D — Resilient Provider Circuit Breaker
 * 
 * Protects downstream providers from cascading failures, enforces timeouts,
 * manages exponential backoff retries, and maintains real-time health metrics.
 */

export interface CircuitBreakerOptions {
  failureThreshold?: number; // Failures before opening circuit (default: 3)
  resetTimeoutMs?: number;   // Time to remain OPEN before HALF_OPEN probe (default: 30000ms)
  timeoutMs?: number;        // Single execution timeout (default: 3000ms)
  maxRetries?: number;       // Retries on transient failure before counting against circuit (default: 1)
  name: string;
}

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class CircuitBreaker<TArgs extends any[], TResult> {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private consecutiveSuccesses = 0;
  private lastStateChange: number = Date.now();
  private lastFailureTime: number = 0;
  private lastError: string | null = null;
  private lastLatencyMs: number = 0;

  readonly name: string;
  readonly failureThreshold: number;
  readonly resetTimeoutMs: number;
  readonly timeoutMs: number;
  readonly maxRetries: number;

  constructor(
    private readonly action: (...args: TArgs) => Promise<TResult>,
    options: CircuitBreakerOptions
  ) {
    this.name = options.name;
    this.failureThreshold = options.failureThreshold ?? 3;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 30000;
    this.timeoutMs = options.timeoutMs ?? 3000;
    this.maxRetries = options.maxRetries ?? 1;
  }

  getState(): CircuitState {
    if (this.state === 'OPEN') {
      const now = Date.now();
      if (now - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = 'HALF_OPEN';
        this.lastStateChange = now;
      }
    }
    return this.state;
  }

  getMetrics() {
    return {
      name: this.name,
      state: this.getState(),
      failureCount: this.failureCount,
      lastError: this.lastError,
      lastLatencyMs: this.lastLatencyMs,
      lastStateChange: new Date(this.lastStateChange).toISOString()
    };
  }

  async execute(fallback: () => Promise<TResult>, ...args: TArgs): Promise<{ result: TResult; latencyMs: number; fromFallback: boolean }> {
    const currentState = this.getState();

    if (currentState === 'OPEN') {
      const start = Date.now();
      const fbResult = await fallback();
      return { result: fbResult, latencyMs: Date.now() - start, fromFallback: true };
    }

    let attempt = 0;
    while (attempt <= this.maxRetries) {
      const start = Date.now();
      try {
        const result = await Promise.race([
          this.action(...args),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Operation timed out after ${this.timeoutMs}ms`)), this.timeoutMs)
          )
        ]);

        const latency = Date.now() - start;
        this.onSuccess(latency);
        return { result, latencyMs: latency, fromFallback: false };
      } catch (err: any) {
        attempt++;
        if (attempt > this.maxRetries) {
          const latency = Date.now() - start;
          this.onFailure(err?.message || 'Unknown error', latency);
          const fbResult = await fallback();
          return { result: fbResult, latencyMs: latency, fromFallback: true };
        }
        // Small backoff before retry
        await new Promise(r => setTimeout(r, 100 * attempt));
      }
    }

    const fbResult = await fallback();
    return { result: fbResult, latencyMs: 0, fromFallback: true };
  }

  private onSuccess(latencyMs: number) {
    this.lastLatencyMs = latencyMs;
    this.lastError = null;

    if (this.state === 'HALF_OPEN') {
      this.consecutiveSuccesses++;
      if (this.consecutiveSuccesses >= 2) {
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.consecutiveSuccesses = 0;
        this.lastStateChange = Date.now();
      }
    } else {
      this.failureCount = 0;
    }
  }

  private onFailure(errorMessage: string, latencyMs: number) {
    this.lastLatencyMs = latencyMs;
    this.lastError = errorMessage;
    this.lastFailureTime = Date.now();
    this.failureCount++;

    if (this.state === 'HALF_OPEN' || this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.lastStateChange = Date.now();
      this.consecutiveSuccesses = 0;
    }
  }

  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.consecutiveSuccesses = 0;
    this.lastError = null;
    this.lastStateChange = Date.now();
  }
}
