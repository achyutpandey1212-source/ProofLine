import { logger } from "../utils/logger";

export type KeyState = "AVAILABLE" | "COOLDOWN" | "UNAVAILABLE";

export interface ManagedKey {
  key: string;
  state: KeyState;
  failureCount: number;
  lastFailureAt: number | null;
  cooldownUntil: number | null;
  lastErrorReason?: string;
}

export type FailureClass =
  | "RATE_LIMIT"
  | "TEMPORARY_FAILURE"
  | "INVALID_CREDENTIALS"
  | "QUOTA_EXHAUSTED"
  | "INVALID_REQUEST";

export interface KeyPoolOptions {
  providerName: string;
  keys: string[];
  cooldownDurationMs?: number; // default: 60s
  quotaCooldownDurationMs?: number; // default: 10m
}

export class ApiKeyPool {
  private readonly providerName: string;
  private readonly keys: ManagedKey[] = [];
  private readonly cooldownDurationMs: number;
  private readonly quotaCooldownDurationMs: number;

  constructor(options: KeyPoolOptions) {
    this.providerName = options.providerName;
    this.cooldownDurationMs = options.cooldownDurationMs ?? 60_000;
    this.quotaCooldownDurationMs = options.quotaCooldownDurationMs ?? 600_000;

    for (const key of options.keys) {
      if (key && key.trim().length > 0) {
        this.keys.push({
          key: key.trim(),
          state: "AVAILABLE",
          failureCount: 0,
          lastFailureAt: null,
          cooldownUntil: null,
        });
      }
    }

    logger.info(`ApiKeyPool initialized for ${this.providerName}`, {
      keyCount: this.keys.length,
    });
  }

  private lastUsedIndex: number = -1;

  public getKeyCount(): number {
    return this.keys.length;
  }

  /**
   * Selects a healthy key from the pool using round-robin rotation.
   * Checks cooldowns and transitions recovered keys back to AVAILABLE.
   */
  public getHealthyKey(): string | null {
    const now = Date.now();

    for (const item of this.keys) {
      if (item.state === "COOLDOWN" && item.cooldownUntil && now >= item.cooldownUntil) {
        item.state = "AVAILABLE";
        item.cooldownUntil = null;
        logger.info(`Key recovered from cooldown in pool [${this.providerName}]`);
      }
    }

    if (this.keys.length === 0) return null;

    // Search round-robin starting from lastUsedIndex + 1
    for (let i = 0; i < this.keys.length; i++) {
      const idx = (this.lastUsedIndex + 1 + i) % this.keys.length;
      const keyItem = this.keys[idx];
      if (keyItem && keyItem.state === "AVAILABLE") {
        this.lastUsedIndex = idx;
        return keyItem.key;
      }
    }

    return null;
  }

  /**
   * Reports an execution success for a key, resetting transient failure counts.
   */
  public reportSuccess(key: string): void {
    const item = this.keys.find((k) => k.key === key);
    if (item && item.state === "AVAILABLE") {
      item.failureCount = 0;
      item.lastErrorReason = undefined;
    }
  }

  /**
   * Reports an execution failure and applies state transition based on failure classification.
   */
  public reportFailure(key: string, failureClass: FailureClass, reason?: string): void {
    const item = this.keys.find((k) => k.key === key);
    if (!item) return;

    const now = Date.now();
    item.failureCount += 1;
    item.lastFailureAt = now;
    item.lastErrorReason = reason;

    switch (failureClass) {
      case "RATE_LIMIT":
        item.state = "COOLDOWN";
        item.cooldownUntil = now + this.cooldownDurationMs;
        logger.warn(
          `Key in pool [${this.providerName}] entered COOLDOWN due to rate limiting (429)`,
          { durationMs: this.cooldownDurationMs }
        );
        break;

      case "QUOTA_EXHAUSTED":
        item.state = "COOLDOWN";
        item.cooldownUntil = now + this.quotaCooldownDurationMs;
        logger.warn(
          `Key in pool [${this.providerName}] entered COOLDOWN due to quota exhaustion`,
          { durationMs: this.quotaCooldownDurationMs }
        );
        break;

      case "INVALID_CREDENTIALS":
        item.state = "UNAVAILABLE";
        logger.error(
          `Key in pool [${this.providerName}] marked UNAVAILABLE due to authentication/invalid key error`
        );
        break;

      case "TEMPORARY_FAILURE":
        // For temporary 503 capacity spikes: put in a short cooldown (15s) after 2 failures so other healthy keys are used
        if (item.failureCount >= 2) {
          item.state = "COOLDOWN";
          item.cooldownUntil = now + 15_000;
          logger.warn(
            `Key in pool [${this.providerName}] entered short 15s COOLDOWN after temporary failure/503 spike`
          );
        }
        break;

      case "INVALID_REQUEST":
        // Invalid request/parameters/schema: Do not rotate or disable keys
        logger.warn(`Invalid request reported for provider [${this.providerName}] - keys unchanged`);
        break;
    }
  }

  /**
   * Classify an error into a FailureClass.
   */
  public static classifyError(error: unknown): FailureClass {
    if (!error) return "TEMPORARY_FAILURE";

    const errString =
      error instanceof Error
        ? `${error.name} ${error.message} ${JSON.stringify(error)}`
        : String(error);

    const lower = errString.toLowerCase();

    if (
      lower.includes("429") ||
      lower.includes("rate limit") ||
      lower.includes("too many requests") ||
      lower.includes("resource_exhausted")
    ) {
      if (lower.includes("quota") || lower.includes("quota exceeded") || lower.includes("billing")) {
        return "QUOTA_EXHAUSTED";
      }
      return "RATE_LIMIT";
    }

    if (
      lower.includes("401") ||
      lower.includes("403") ||
      lower.includes("api key not valid") ||
      lower.includes("invalid_api_key") ||
      lower.includes("authentication") ||
      lower.includes("unauthenticated") ||
      lower.includes("denied access") ||
      lower.includes("permission denied")
    ) {
      return "INVALID_CREDENTIALS";
    }

    if (
      lower.includes("invalid argument") ||
      lower.includes("bad request") ||
      lower.includes("400") ||
      lower.includes("invalid schema") ||
      lower.includes("validation error")
    ) {
      return "INVALID_REQUEST";
    }

    return "TEMPORARY_FAILURE";
  }

  /**
   * Executes an operation with bounded retries and key rotation.
   */
  public async executeWithKey<T>(
    operation: (apiKey: string) => Promise<T>,
    maxRetries?: number
  ): Promise<T> {
    const effectiveMaxRetries = maxRetries ?? Math.max(this.keys.length, 8);
    let attempts = 0;

    while (attempts < effectiveMaxRetries) {
      attempts++;
      const currentKey = this.getHealthyKey();

      if (!currentKey) {
        throw new Error(
          `All API keys in pool [${this.providerName}] are currently unavailable or in cooldown.`
        );
      }

      try {
        const result = await operation(currentKey);
        this.reportSuccess(currentKey);
        return result;
      } catch (err) {
        const failureClass = ApiKeyPool.classifyError(err);
        this.reportFailure(currentKey, failureClass, err instanceof Error ? err.message : String(err));

        // For invalid client requests, retrying with another key is useless
        if (failureClass === "INVALID_REQUEST") {
          throw err;
        }

        // If we reached the maximum retry limit, stop and propagate
        if (attempts >= effectiveMaxRetries) {
          throw err;
        }

        // Gentle jittered delay before next key attempt
        const backoffMs = Math.min(300 * attempts + Math.random() * 200, 2000);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }

    throw new Error(`Exceeded maximum retries (${effectiveMaxRetries}) for provider [${this.providerName}].`);
  }
}
