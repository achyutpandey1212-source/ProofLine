import mongoose from "mongoose";
import { CaseModel } from "../models/case.model";
import { EvidenceModel, IEvidence } from "../models/evidence.model";
import { geminiProvider } from "./aiProvider.service";
import { GeminiExtractionService, ExtractionProgressEvent } from "./geminiExtraction.service";
import {
  getExtractionSystemInstruction,
  getExtractionPromptForType,
} from "../prompts/evidenceExtraction.prompt";
import { getSchemaForEvidenceType } from "../validators/extraction.validator";
import { AppError } from "../middleware/error.middleware";
import { logger } from "../utils/logger";

export class ExtractionService {
  /**
   * Fetches an evidence file buffer from ImageKit or URL.
   */
  private static async fetchEvidenceBuffer(fileUrl: string): Promise<Buffer> {
    try {
      const res = await fetch(fileUrl, { signal: AbortSignal.timeout(30_000) });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} fetching evidence from storage`);
      }
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (err) {
      logger.error("Failed to download evidence file for extraction", {
        error: err instanceof Error ? err.message : "Unknown error",
      });
      throw new AppError("Failed to retrieve evidence file for processing.", 502, "FILE_RETRIEVAL_ERROR");
    }
  }

  /**
   * Extracts facts from an existing Evidence document using Gemini with ownership check,
   * duplicate-processing protection, runtime Zod validation, and safe state transitions.
   */
  public static async extractEvidence(params: {
    userId: mongoose.Types.ObjectId;
    caseIdOrMongoId: string;
    evidenceIdOrMongoId: string;
    /** Set by the workflow (which already serialises runs per case) to reclaim items stuck in PROCESSING. */
    reclaimStale?: boolean;
    onProgress?: (event: ExtractionProgressEvent) => void;
  }): Promise<IEvidence> {
    const { userId, caseIdOrMongoId, evidenceIdOrMongoId } = params;

    // 1. Verify Case exists and is owned by the user
    const isCaseObjectId = mongoose.Types.ObjectId.isValid(caseIdOrMongoId);
    const caseQuery = isCaseObjectId
      ? { $or: [{ _id: caseIdOrMongoId }, { caseId: caseIdOrMongoId }], userId }
      : { caseId: caseIdOrMongoId, userId };

    const caseDoc = await CaseModel.findOne(caseQuery);
    if (!caseDoc) {
      throw new AppError("Verification case not found or access denied.", 404, "NOT_FOUND");
    }

    // 2. Verify Evidence exists and is associated with the verified Case
    const isEvidenceObjectId = mongoose.Types.ObjectId.isValid(evidenceIdOrMongoId);
    const evidenceQuery = isEvidenceObjectId
      ? { $or: [{ _id: evidenceIdOrMongoId }, { evidenceId: evidenceIdOrMongoId }], caseId: caseDoc._id }
      : { evidenceId: evidenceIdOrMongoId, caseId: caseDoc._id };

    const evidenceDoc = await EvidenceModel.findOne(evidenceQuery);
    if (!evidenceDoc) {
      throw new AppError("Evidence record not found or access denied.", 404, "NOT_FOUND");
    }

    // 3. Concurrency Protection: Check if already processing
    if (evidenceDoc.status === "PROCESSING" && !params.reclaimStale) {
      throw new AppError(
        "Evidence extraction is currently in progress. Duplicate extraction prevented.",
        409,
        "ALREADY_PROCESSING"
      );
    }

    // 4. Mark status as PROCESSING
    evidenceDoc.status = "PROCESSING";
    await evidenceDoc.save();

    try {
      // 5. Retrieve file buffer
      const fileBuffer = await this.fetchEvidenceBuffer(evidenceDoc.file.url);

      // 6. Prepare prompt & instruction
      const systemInstruction = getExtractionSystemInstruction(evidenceDoc.type);
      const prompt = getExtractionPromptForType(evidenceDoc.type);

      // 7. Call Gemini through GeminiExtractionService & key pool
      const rawTextResponse = await GeminiExtractionService.generateStructuredExtraction({
        systemInstruction,
        prompt,
        fileBuffer,
        mimeType: evidenceDoc.file.mimeType,
        onProgress: params.onProgress,
      });

      // 8. Parse JSON response
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(rawTextResponse);
      } catch (parseErr) {
        logger.error("Gemini returned invalid JSON string", {
          evidenceId: evidenceDoc.evidenceId,
          error: parseErr instanceof Error ? parseErr.message : "JSON parse error",
        });
        throw new AppError("Model output could not be parsed as valid JSON.", 502, "INVALID_MODEL_OUTPUT");
      }

      // 9. Runtime validation using Zod schema for this specific EvidenceType
      const validator = getSchemaForEvidenceType(evidenceDoc.type);
      const validationResult = await validator.safeParseAsync(parsedJson);

      if (!validationResult.success) {
        logger.error("Extraction failed runtime schema validation", {
          evidenceId: evidenceDoc.evidenceId,
          errors: validationResult.error.errors,
        });
        throw new AppError("Extracted data did not match required schema.", 502, "SCHEMA_VALIDATION_FAILED");
      }

      // 10. Persist validated extraction & update status to EXTRACTED
      const validatedData = validationResult.data as Record<string, unknown>;
      const confidence = typeof validatedData["confidence"] === "number" ? validatedData["confidence"] : 0.8;
      const warnings = Array.isArray(validatedData["warnings"]) ? (validatedData["warnings"] as string[]) : [];

      evidenceDoc.extraction = {
        status: "EXTRACTED",
        model: geminiProvider.modelName,
        extractedAt: new Date(),
        data: validatedData,
        confidence,
        warnings,
      };
      evidenceDoc.status = "EXTRACTED";
      await evidenceDoc.save();

      logger.info("Evidence extraction succeeded and persisted", {
        evidenceId: evidenceDoc.evidenceId,
        caseId: caseDoc.caseId,
        status: evidenceDoc.status,
      });

      return evidenceDoc;
    } catch (err) {
      // 11. Handle failure: ensure evidence does NOT stay in PROCESSING
      logger.error("Evidence extraction failed", {
        evidenceId: evidenceDoc.evidenceId,
        error: err instanceof Error ? err.message : "Unknown error",
      });

      evidenceDoc.status = "EXTRACTION_FAILED";
      evidenceDoc.extraction = {
        status: "FAILED",
        model: geminiProvider.modelName,
        extractedAt: new Date(),
        warnings: [err instanceof Error ? err.message : "Extraction failure"],
      };
      await evidenceDoc.save();

      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError("Evidence extraction failed.", 500, "EXTRACTION_ERROR");
    }
  }
}
