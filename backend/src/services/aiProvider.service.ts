import { env } from "../config/env";
import { ApiKeyPool } from "./keyPool.service";
import { logger } from "../utils/logger";

export interface AIProvider {
  readonly providerName: string;
  readonly modelName: string;
  getKeyCount(): number;
  execute<T>(operation: (apiKey: string) => Promise<T>): Promise<T>;
}

export class GeminiProvider implements AIProvider {
  public readonly providerName = "Gemini";
  public readonly modelName: string;
  private readonly keyPool: ApiKeyPool;

  constructor() {
    this.modelName = env.GEMINI_MODEL;
    this.keyPool = new ApiKeyPool({
      providerName: this.providerName,
      keys: env.GEMINI_API_KEYS,
    });
  }

  public getKeyCount(): number {
    return this.keyPool.getKeyCount();
  }

  public async execute<T>(operation: (apiKey: string) => Promise<T>): Promise<T> {
    return this.keyPool.executeWithKey(operation);
  }
}

export class GroqProvider implements AIProvider {
  public readonly providerName = "Groq";
  public readonly modelName: string;
  private readonly keyPool: ApiKeyPool;

  constructor() {
    this.modelName = env.GROQ_MODEL;
    this.keyPool = new ApiKeyPool({
      providerName: this.providerName,
      keys: env.GROQ_API_KEYS,
    });
  }

  public getKeyCount(): number {
    return this.keyPool.getKeyCount();
  }

  public async execute<T>(operation: (apiKey: string) => Promise<T>): Promise<T> {
    return this.keyPool.executeWithKey(operation);
  }
}

// Singletons for application consumption
export const geminiProvider = new GeminiProvider();
export const groqProvider = new GroqProvider();

export const logProviderConfiguration = (): void => {
  logger.info("AI Provider pools configured", {
    gemini: {
      keyPoolDetected: geminiProvider.getKeyCount() > 0 ? "YES" : "NO",
      keyCount: geminiProvider.getKeyCount(),
      model: geminiProvider.modelName,
    },
    groq: {
      keyPoolDetected: groqProvider.getKeyCount() > 0 ? "YES" : "NO",
      keyCount: groqProvider.getKeyCount(),
      model: groqProvider.modelName,
    },
  });
};
