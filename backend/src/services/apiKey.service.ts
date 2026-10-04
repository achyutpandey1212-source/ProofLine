import crypto from "crypto";
import mongoose from "mongoose";
import { ApiKeyModel, IApiKey } from "../models/apiKey.model";
import { AppError } from "../middleware/error.middleware";

export interface GeneratedApiKey {
  apiKey: string;      // Raw plaintext key returned only ONCE
  keyPrefix: string;   // Display prefix
  name: string;
  createdAt: Date;
  id: string;
}

export class ApiKeyService {
  /**
   * Hashes an API key using SHA-256 for secure storage & lookup.
   */
  public static hashApiKey(rawKey: string): string {
    return crypto.createHash("sha256").update(rawKey.trim()).digest("hex");
  }

  /**
   * Generates a new API key.
   * Format: pl_live_<24-random-hex-chars>
   * Only the hash and prefix are persisted to MongoDB.
   */
  public static async createApiKey(
    userId: mongoose.Types.ObjectId,
    name: string
  ): Promise<GeneratedApiKey> {
    const rawSecret = crypto.randomBytes(24).toString("hex");
    const rawKey = `pl_live_${rawSecret}`;
    const keyPrefix = rawKey.slice(0, 15) + "...";
    const keyHash = this.hashApiKey(rawKey);

    const doc = await ApiKeyModel.create({
      userId,
      keyPrefix,
      keyHash,
      name: name.trim() || "Default API Key",
      isRevoked: false,
    });

    return {
      id: String(doc._id),
      apiKey: rawKey,
      keyPrefix,
      name: doc.name,
      createdAt: doc.createdAt,
    };
  }

  /**
   * Validates a raw API key from incoming Bearer token.
   * Updates lastUsedAt if valid.
   */
  public static async validateApiKey(rawKey: string): Promise<IApiKey | null> {
    if (!rawKey || !rawKey.startsWith("pl_live_")) {
      return null;
    }

    const keyHash = this.hashApiKey(rawKey);
    const keyDoc = await ApiKeyModel.findOne({ keyHash });

    if (!keyDoc) {
      return null;
    }

    if (keyDoc.isRevoked) {
      return null;
    }

    if (keyDoc.expiresAt && keyDoc.expiresAt < new Date()) {
      return null;
    }

    // Touch lastUsedAt asynchronously without blocking request
    ApiKeyModel.updateOne({ _id: keyDoc._id }, { lastUsedAt: new Date() }).exec();

    return keyDoc;
  }

  /**
   * Lists API keys for a user (without hashes or secret values).
   */
  public static async listUserKeys(userId: mongoose.Types.ObjectId): Promise<IApiKey[]> {
    return ApiKeyModel.find({ userId }).sort({ createdAt: -1 });
  }

  /**
   * Revokes an existing API key.
   */
  public static async revokeApiKey(
    userId: mongoose.Types.ObjectId,
    keyId: string
  ): Promise<void> {
    const keyDoc = await ApiKeyModel.findOne({ _id: keyId, userId });
    if (!keyDoc) {
      throw new AppError("API key not found.", 404, "NOT_FOUND");
    }

    keyDoc.isRevoked = true;
    await keyDoc.save();
  }
}
