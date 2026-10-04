import { Router, Request, Response, NextFunction } from "express";
import { ApiV1Controller } from "../controllers/apiV1.controller";
import {
  authenticateApiKey,
  apiKeyRateLimiter,
  idempotencyMiddleware,
  requestIdMiddleware,
} from "../middleware/apiV1.middleware";
import { uploadMiddleware } from "../middleware/upload.middleware";
import {
  createVerificationSchema,
  verificationIdParamSchema,
  uploadApiEvidenceBodySchema,
} from "../validators/apiV1.validator";
import { ZodError } from "zod";

const router = Router();

// 1. Attach Request ID to every /api/v1/* request
router.use(requestIdMiddleware);

// 2. Validate external requests with strict error contract
const validateApiV1 = (schemas: {
  body?: any;
  params?: any;
  query?: any;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid verification request",
            details: error.errors.map((e) => ({
              field: e.path.join("."),
              message: e.message,
            })),
            requestId: req.requestId,
          },
        });
        return;
      }
      next(error);
    }
  };
};

// 3. Authenticate with API Key
router.use(authenticateApiKey);

// 4. Rate Limiting (60 requests per minute)
router.use(apiKeyRateLimiter(60, 60 * 1000));

// ==========================================
// API V1 ENDPOINTS
// ==========================================

// POST /api/v1/verifications (Supports Idempotency-Key)
router.post(
  "/verifications",
  idempotencyMiddleware,
  validateApiV1({ body: createVerificationSchema }),
  ApiV1Controller.createVerification
);

// POST /api/v1/verifications/:verificationId/evidence
router.post(
  "/verifications/:verificationId/evidence",
  validateApiV1({ params: verificationIdParamSchema }),
  uploadMiddleware.single("file"),
  validateApiV1({ body: uploadApiEvidenceBodySchema }),
  ApiV1Controller.uploadEvidence
);

// POST /api/v1/verifications/:verificationId/run (Supports Idempotency-Key)
router.post(
  "/verifications/:verificationId/run",
  idempotencyMiddleware,
  validateApiV1({ params: verificationIdParamSchema }),
  ApiV1Controller.runVerification
);

// GET /api/v1/verifications/:verificationId
router.get(
  "/verifications/:verificationId",
  validateApiV1({ params: verificationIdParamSchema }),
  ApiV1Controller.getVerificationStatus
);

// GET /api/v1/verifications/:verificationId/proof-packet
router.get(
  "/verifications/:verificationId/proof-packet",
  validateApiV1({ params: verificationIdParamSchema }),
  ApiV1Controller.getProofPacket
);

// Custom Error Formatter for API v1 to ensure strict error contract
router.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.statusCode || (err.status ? err.status : 500);
  const errorCode = err.code || "INTERNAL_SERVER_ERROR";
  const message =
    statusCode >= 500
      ? "An unexpected internal server error occurred."
      : err.message || "An error occurred while processing your request.";

  res.status(statusCode).json({
    error: {
      code: errorCode,
      message,
      requestId: req.requestId,
    },
  });
});

export default router;
