import { GoogleGenAI } from "@google/genai";
import { geminiProvider } from "./aiProvider.service";
import { logger } from "../utils/logger";
import { AppError } from "../middleware/error.middleware";

export interface MultimodalContentPart {
  mimeType: string;
  data: Buffer;
}

export class GeminiExtractionService {
  /**
   * Executes a multimodal structured JSON extraction through the GeminiProvider key pool.
   */
  public static async generateStructuredExtraction(params: {
    systemInstruction: string;
    prompt: string;
    fileBuffer: Buffer;
    mimeType: string;
  }): Promise<string> {
    return geminiProvider.execute(async (apiKey: string) => {
      const modelsToTry = [
        geminiProvider.modelName,
        "gemini-3.5-flash",
        "gemini-2.5-flash",
      ].filter((m, i, arr) => m && arr.indexOf(m) === i);

      let lastError: unknown;

      for (const model of modelsToTry) {
        try {
          logger.info("Invoking Gemini multimodal API with active pool key", {
            model,
            mimeType: params.mimeType,
            bufferLength: params.fileBuffer.length,
          });

          const ai = new GoogleGenAI({ apiKey });

          const response = await ai.models.generateContent({
            model,
            contents: [
              {
                role: "user",
                parts: [
                  {
                    inlineData: {
                      mimeType: params.mimeType,
                      data: params.fileBuffer.toString("base64"),
                    },
                  },
                  {
                    text: params.prompt,
                  },
                ],
              },
            ],
            config: {
              systemInstruction: params.systemInstruction,
              responseMimeType: "application/json",
              temperature: 0.1, // Low temperature for deterministic extraction
            },
          });

          const text = response.text;
          if (!text || text.trim().length === 0) {
            throw new AppError("Empty response returned by Gemini model", 502, "EMPTY_MODEL_RESPONSE");
          }

          return text;
        } catch (err) {
          lastError = err;
          const msg = err instanceof Error ? err.message : String(err);
          if (
            msg.includes("503") ||
            msg.includes("high demand") ||
            msg.includes("UNAVAILABLE") ||
            msg.includes("not found") ||
            msg.includes("404") ||
            msg.includes("429") ||
            msg.includes("RESOURCE_EXHAUSTED")
          ) {
            logger.warn(`Model ${model} unavailable or capacity spike. Retrying with fallback model...`, {
              error: msg,
            });
            continue;
          }
          throw err;
        }
      }

      throw lastError;
    });
  }
}
