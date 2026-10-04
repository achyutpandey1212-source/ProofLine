import { Router } from "express";
import { VerificationController } from "../controllers/verification.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validate.middleware";
import { verifyCaseParamSchema } from "../validators/verification.validator";

const router = Router();

// Verification routes require authentication
router.use(authenticateToken);

router.post(
  "/cases/:caseId/verify",
  validateRequest({ params: verifyCaseParamSchema }),
  VerificationController.verify
);

router.get(
  "/cases/:caseId/verification",
  validateRequest({ params: verifyCaseParamSchema }),
  VerificationController.getVerification
);

export default router;
