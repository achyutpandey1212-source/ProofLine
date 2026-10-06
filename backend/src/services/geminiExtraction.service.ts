import { GoogleGenAI } from "@google/genai";
import { geminiProvider } from "./aiProvider.service";
import { logger } from "../utils/logger";
import { AppError } from "../middleware/error.middleware";

export interface MultimodalContentPart {
  mimeType: string;
  data: Buffer;
}

export interface ExtractionProgressEvent {
  kind: "attempt" | "retry" | "winner";
  detail: string;
}

/** Number of concurrent streams raced against each other (each on a different API key). */
const HEDGE_STREAMS = 2;
/** A single Gemini call that takes longer than this is abandoned and retried on another key. */
const ATTEMPT_TIMEOUT_MS = 55_000;
/** Absolute ceiling for one extraction, across every stream, key and model. */
const OVERALL_DEADLINE_MS = 100_000;

const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        resolve();
      },
      { once: true }
    );
  });

const errText = (err: unknown): string => (err instanceof Error ? err.message : String(err));

export class GeminiExtractionService {
  /**
   * Executes a multimodal structured JSON extraction.
   *
   * Hedged execution: HEDGE_STREAMS streams run concurrently, each on its own key from the pool.
   * The first stream to return valid JSON wins and the others are aborted. Each stream rotates keys
   * on rate limits, falls back across models on capacity errors and gives up on any single call after
   * ATTEMPT_TIMEOUT_MS. The whole operation is bounded by OVERALL_DEADLINE_MS.
   */
  public static async generateStructuredExtraction(params: {
    systemInstruction: string;
    prompt: string;
    fileBuffer: Buffer;
    mimeType: string;
    onProgress?: (event: ExtractionProgressEvent) => void;
  }): Promise<string> {
    if (geminiProvider.getKeyCount() === 0) {
      throw new AppError("No Gemini API keys are configured.", 500, "NO_API_KEYS");
    }

    const models = [geminiProvider.modelName, "gemini-3.5-flash", "gemini-2.5-flash"].filter(
      (m, i, arr) => m && arr.indexOf(m) === i
    );
    const base64 = params.fileBuffer.toString("base64");
    const keysInFlight = new Set<string>();
    const raceController = new AbortController();
    const startedAt = Date.now();

    const runStream = async (streamId: number): Promise<string> => {
      let attempt = 0;
      let modelIdx = 0;
      let invalidRequestCount = 0;

      while (!raceController.signal.aborted) {
        if (Date.now() - startedAt > OVERALL_DEADLINE_MS) {
          throw new AppError("Model did not respond in time.", 504, "MODEL_DEADLINE_EXCEEDED");
        }

        const key = geminiProvider.acquireKey(keysInFlight);
        if (!key) {
          // Every key is cooling down. Wait briefly for one to recover instead of failing.
          await sleep(1500, raceController.signal);
          continue;
        }

        const model = models[Math.min(modelIdx, models.length - 1)] as string;
        attempt++;
        keysInFlight.add(key);
        params.onProgress?.({ kind: "attempt", detail: `stream ${streamId} attempt ${attempt} on ${model}` });

        try {
          const ai = new GoogleGenAI({ apiKey: key });
          const attemptSignal = AbortSignal.any([raceController.signal, AbortSignal.timeout(ATTEMPT_TIMEOUT_MS)]);

          const response = await ai.models.generateContent({
            model,
            contents: [
              {
                role: "user",
                parts: [{ inlineData: { mimeType: params.mimeType, data: base64 } }, { text: params.prompt }],
              },
            ],
            config: {
              systemInstruction: params.systemInstruction,
              responseMimeType: "application/json",
              temperature: 0.1,
              abortSignal: attemptSignal,
            },
          });

          const text = response.text;
          if (!text || text.trim().length === 0) {
            throw new Error("EMPTY_MODEL_RESPONSE");
          }
          // Only a parseable response may win the race.
          JSON.parse(text);

          geminiProvider.reportKeySuccess(key);
          return text;
        } catch (err) {
          if (raceController.signal.aborted) {
            // Another stream already won; this error is irrelevant.
            throw err;
          }

          const msg = errText(err);
          const timedOut = /abort|timeout|timed out/i.test(msg);
          const failureClass = timedOut ? "TEMPORARY_FAILURE" : geminiProvider.reportKeyFailure(key, err);

          logger.warn("Gemini stream attempt failed", {
            streamId,
            attempt,
            model,
            failureClass,
            timedOut,
            error: msg.slice(0, 200),
          });
          params.onProgress?.({
            kind: "retry",
            detail: timedOut
              ? `stream ${streamId} timed out, rotating key`
              : `stream ${streamId} ${failureClass.toLowerCase().replace(/_/g, " ")}, rotating key`,
          });

          const lower = msg.toLowerCase();
          const modelProblem =
            lower.includes("503") ||
            lower.includes("unavailable") ||
            lower.includes("high demand") ||
            lower.includes("404") ||
            lower.includes("not found") ||
            timedOut;
          if (failureClass === "INVALID_REQUEST") {
            invalidRequestCount++;
            // A genuinely malformed request fails on every model. Give up once all have rejected it.
            if (invalidRequestCount >= models.length) throw err;
            modelIdx++;
          } else if (modelProblem && modelIdx < models.length - 1 && attempt % 2 === 0) {
            modelIdx++;
          }
        } finally {
          keysInFlight.delete(key);
        }

        await sleep(Math.min(400 * attempt + Math.random() * 300, 3000), raceController.signal);
      }

      throw new Error("Stream cancelled");
    };

    return new Promise<string>((resolve, reject) => {
      let pending = HEDGE_STREAMS;
      let settled = false;
      let lastError: unknown;

      const deadlineTimer = setTimeout(() => {
        if (settled) return;
        settled = true;
        raceController.abort();
        reject(new AppError("Model did not respond in time.", 504, "MODEL_DEADLINE_EXCEEDED"));
      }, OVERALL_DEADLINE_MS + 5_000);

      for (let s = 1; s <= HEDGE_STREAMS; s++) {
        runStream(s).then(
          (text) => {
            if (settled) return;
            settled = true;
            clearTimeout(deadlineTimer);
            raceController.abort();
            params.onProgress?.({ kind: "winner", detail: `stream ${s} returned in ${Date.now() - startedAt}ms` });
            logger.info("Gemini hedged extraction resolved", { winner: s, elapsedMs: Date.now() - startedAt });
            resolve(text);
          },
          (err) => {
            lastError = err;
            pending--;
            if (pending === 0 && !settled) {
              settled = true;
              clearTimeout(deadlineTimer);
              raceController.abort();
              reject(lastError);
            }
          }
        );
      }
    });
  }
}
