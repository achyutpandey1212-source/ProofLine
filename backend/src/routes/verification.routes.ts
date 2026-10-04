import { Router } from "express";
import { VerificationController } from "../controllers/verification.controller";
import { SimulationController } from "../controllers/simulation.controller";
import { ProofPacketController } from "../controllers/proofPacket.controller";
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

router.post(
  "/cases/:caseId/simulate",
  validateRequest({ params: verifyCaseParamSchema }),
  SimulationController.simulate
);

router.post(
  "/cases/:caseId/proof-packet",
  validateRequest({ params: verifyCaseParamSchema }),
  ProofPacketController.getPacketMetadata
);

router.get(
  "/cases/:caseId/proof-packet/pdf",
  validateRequest({ params: verifyCaseParamSchema }),
  ProofPacketController.downloadPdf
);

router.get(
  "/cases/:caseId/verification/status",
  validateRequest({ params: verifyCaseParamSchema }),
  VerificationController.getStatus
);

router.get(
  "/cases/:caseId/verification",
  validateRequest({ params: verifyCaseParamSchema }),
  VerificationController.getVerification
);

export default router;
