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
      logger.info("Invoking Gemini multimodal API with active pool key", {
        model: geminiProvider.modelName,
        mimeType: params.mimeType,
        bufferLength: params.fileBuffer.length,
      });

      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: geminiProvider.modelName,
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
    });
  }
}
