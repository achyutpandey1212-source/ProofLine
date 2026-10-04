import { Request, Response, NextFunction } from "express";
import admin from "firebase-admin";
import { getFirebaseAdmin } from "../config/firebase";
import { logger } from "../utils/logger";

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  role?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication token missing or invalid format.",
      },
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Bearer token missing.",
      },
    });
    return;
  }

  const app = getFirebaseAdmin();
  if (!app) {
    logger.warn("Authentication requested but Firebase Admin is not configured");
    res.status(503).json({
      success: false,
      error: {
        code: "AUTH_SERVICE_UNAVAILABLE",
        message: "Authentication service currently unavailable.",
      },
    });
    return;
  }

  try {
    const decodedToken: admin.auth.DecodedIdToken = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: (decodedToken["role"] as string) || "USER",
    };
    next();
  } catch (error) {
    logger.warn("Token verification failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    res.status(401).json({
      success: false,
      error: {
        code: "INVALID_TOKEN",
        message: "Provided authentication token is expired or invalid.",
      },
    });
  }
};
