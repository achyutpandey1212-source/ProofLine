import { Router } from "express";
import { ApiKeyManagementController } from "../controllers/apiKeyManagement.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

// Internal dashboard API key routes require Firebase token auth
router.use(authenticateToken);

router.post("/api-keys", ApiKeyManagementController.createKey);
router.get("/api-keys", ApiKeyManagementController.listKeys);
router.delete("/api-keys/:keyId", ApiKeyManagementController.revokeKey);

export default router;
