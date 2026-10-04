import { Router } from "express";
import { EvidenceController } from "../controllers/evidence.controller";
import { ExtractionController } from "../controllers/extraction.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { uploadMiddleware } from "../middleware/upload.middleware";
import { validateRequest } from "../middleware/validate.middleware";
import { uploadEvidenceBodySchema, caseIdParamSchema } from "../validators/evidence.validator";
import { extractParamSchema } from "../validators/extractionParams.validator";

const router = Router();

// Evidence routes require authentication
router.use(authenticateToken);

router.post(
  "/cases/:id/evidence",
  validateRequest({ params: caseIdParamSchema }),
  uploadMiddleware.single("file"),
  validateRequest({ body: uploadEvidenceBodySchema }),
  EvidenceController.upload
);

router.get(
  "/cases/:id/evidence",
  validateRequest({ params: caseIdParamSchema }),
  EvidenceController.listForCase
);

// Trigger extraction on specific evidence
router.post(
  "/cases/:caseId/evidence/:evidenceId/extract",
  validateRequest({ params: extractParamSchema }),
  ExtractionController.extract
);

export default router;
