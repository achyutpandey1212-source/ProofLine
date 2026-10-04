import { Request, Response, NextFunction } from "express";
import { ApiKeyService } from "../services/apiKey.service";
import { AppError } from "../middleware/error.middleware";

export class ApiKeyManagementController {
  /**
   * POST /api-keys
   * Generates a new API key for the authenticated user.
   * Returns plaintext key ONLY ONCE.
   */
  public static async createKey(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401, "UNAUTHORIZED");
      }

      const name = (req.body.name as string) || "Production Integration";
      const keyData = await ApiKeyService.createApiKey(req.user.userDoc._id, name);

      res.status(201).json({
        success: true,
        data: keyData,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api-keys
   * Lists all existing API keys for the user (masked prefix, status, metadata).
   */
  public static async listKeys(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401, "UNAUTHORIZED");
      }

      const keys = await ApiKeyService.listUserKeys(req.user.userDoc._id);

      res.status(200).json({
        success: true,
        data: keys.map((k) => ({
          id: String(k._id),
          name: k.name,
          keyPrefix: k.keyPrefix,
          isRevoked: k.isRevoked,
          lastUsedAt: k.lastUsedAt,
          createdAt: k.createdAt,
        })),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api-keys/:keyId
   * Revokes an existing API key.
   */
  public static async revokeKey(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401, "UNAUTHORIZED");
      }

      const keyId = req.params["keyId"];
      if (!keyId) {
        throw new AppError("Key ID is required.", 400, "BAD_REQUEST");
      }

      await ApiKeyService.revokeApiKey(req.user.userDoc._id, keyId);

      res.status(200).json({
        success: true,
        message: "API key revoked successfully.",
      });
    } catch (err) {
      next(err);
    }
  }
}
