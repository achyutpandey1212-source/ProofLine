import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { ApiKeyService } from "../services/apiKey.service";
import { UserModel, IUser } from "../models/user.model";
import { IApiKey } from "../models/apiKey.model";
import { IdempotencyKeyModel } from "../models/idempotencyKey.model";

export interface ExternalClientContext {
  apiKeyDoc: IApiKey;
  userDoc: IUser;
  requestId: string;
}

declare global {
  namespace Express {
    interface Request {
      externalClient?: ExternalClientContext;
      requestId?: string;
    }
  }
}

/**
 * Attaches a unique request ID (X-Request-ID) to every incoming request and response.
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const incomingId = req.headers["x-request-id"];
  const requestId = typeof incomingId === "string" && incomingId.trim()
    ? incomingId.trim()
    : `req_${crypto.randomBytes(12).toString("hex")}`;

  req.requestId = requestId;
  res.setHeader("X-Request-ID", requestId);
  next();
};

/**
 * Authenticates external API clients using API Key in Authorization header:
 * Authorization: Bearer <API_KEY>
 */
export const authenticateApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const requestId = req.requestId || `req_${crypto.randomBytes(12).toString("hex")}`;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "API key missing or malformed. Expected 'Authorization: Bearer <API_KEY>'",
        requestId,
      },
    });
    return;
  }

  const rawKey = authHeader.split(" ")[1]?.trim();
  if (!rawKey) {
    res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "API key token missing.",
        requestId,
      },
    });
    return;
  }

  try {
    const keyDoc = await ApiKeyService.validateApiKey(rawKey);
    if (!keyDoc) {
      res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid, revoked, or expired API key.",
          requestId,
        },
      });
      return;
    }

    const userDoc = await UserModel.findById(keyDoc.userId);
    if (!userDoc) {
      res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "API key owner account not found.",
          requestId,
        },
      });
      return;
    }

    req.externalClient = {
      apiKeyDoc: keyDoc,
      userDoc,
      requestId,
    };

    next();
  } catch (err) {
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Authentication processing failed.",
        requestId,
      },
    });
  }
};

/**
 * In-memory sliding window rate limiter keyed by API key hash.
 * 60 requests per minute by default for standard external clients.
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const apiKeyRateLimiter = (limit: number = 60, windowMs: number = 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.externalClient?.apiKeyDoc.keyHash || req.ip || "unknown";
    const now = Date.now();
    const current = rateLimitMap.get(key);

    if (!current || now > current.resetTime) {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      res.setHeader("X-RateLimit-Limit", limit);
      res.setHeader("X-RateLimit-Remaining", limit - 1);
      next();
      return;
    }

    if (current.count >= limit) {
      const retryAfterSeconds = Math.ceil((current.resetTime - now) / 1000);
      res.setHeader("Retry-After", retryAfterSeconds);
      res.setHeader("X-RateLimit-Limit", limit);
      res.setHeader("X-RateLimit-Remaining", 0);
      res.status(429).json({
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: `Too many requests. Limit is ${limit} requests per minute. Please retry after ${retryAfterSeconds} seconds.`,
          requestId: req.requestId,
        },
      });
      return;
    }

    current.count += 1;
    res.setHeader("X-RateLimit-Limit", limit);
    res.setHeader("X-RateLimit-Remaining", limit - current.count);
    next();
  };
};

/**
 * Server-side Idempotency handler for POST routes.
 * Supports header: Idempotency-Key: <unique-key>
 */
export const idempotencyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const idempotencyKey = req.headers["idempotency-key"];
  if (!idempotencyKey || typeof idempotencyKey !== "string" || !idempotencyKey.trim()) {
    return next();
  }

  const cleanKey = idempotencyKey.trim();
  const userId = req.externalClient?.userDoc._id;
  if (!userId) {
    return next();
  }

  const route = req.originalUrl.split("?")[0] || req.path;

  try {
    const existing = await IdempotencyKeyModel.findOne({
      key: cleanKey,
      userId,
      route,
    });

    if (existing) {
      res.setHeader("Idempotent-Replay", "true");
      res.status(existing.statusCode).json(existing.responseBody);
      return;
    }

    // Intercept res.json to cache response for replay
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        IdempotencyKeyModel.create({
          key: cleanKey,
          userId,
          route,
          statusCode: res.statusCode,
          responseBody: body,
        }).catch(() => {
          // Ignore duplicate write race condition
        });
      }
      return originalJson(body);
    };

    next();
  } catch (err) {
    next(err);
  }
};
