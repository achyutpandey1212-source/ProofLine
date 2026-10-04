import { Router } from "express";
import { EvidenceController } from "../controllers/evidence.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { uploadMiddleware } from "../middleware/upload.middleware";
import { validateRequest } from "../middleware/validate.middleware";
import { uploadEvidenceBodySchema, caseIdParamSchema } from "../validators/evidence.validator";

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

export default router;
