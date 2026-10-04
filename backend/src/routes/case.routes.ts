import { Router } from "express";
import { CaseController } from "../controllers/case.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validate.middleware";
import { createCaseSchema, caseParamSchema } from "../validators/case.validator";

import { ReviewController } from "../controllers/review.controller";

const router = Router();

// All case routes require authentication
router.use(authenticateToken);

router.post(
  "/cases",
  validateRequest({ body: createCaseSchema }),
  CaseController.create
);

router.get("/cases", CaseController.list);

router.get(
  "/cases/:id",
  validateRequest({ params: caseParamSchema }),
  CaseController.getById
);

router.get(
  "/cases/:id/proof-graph",
  validateRequest({ params: caseParamSchema }),
  CaseController.getProofGraph
);

// Human Review & Resolution endpoints
router.post(
  "/cases/:id/review",
  validateRequest({ params: caseParamSchema }),
  ReviewController.recordReview
);

router.get(
  "/cases/:id/review",
  validateRequest({ params: caseParamSchema }),
  ReviewController.getReviewSummary
);

export default router;
