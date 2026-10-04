import { Request, Response, NextFunction } from "express";
import admin from "firebase-admin";
import { getFirebaseAdmin } from "../config/firebase";
import { UserService } from "../services/user.service";
import { IUser } from "../models/user.model";
import { logger } from "../utils/logger";

export interface AuthenticatedUserContext {
  uid: string;
  email: string;
  userDoc: IUser;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUserContext;
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
        message: "Authentication token missing or invalid format. Expected 'Bearer <token>'.",
      },
    });
    return;
  }

  const token = authHeader.split(" ")[1]?.trim();

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
    const decodedToken: admin.auth.DecodedIdToken = await app.auth().verifyIdToken(token);

    if (!decodedToken.uid) {
      res.status(401).json({
        success: false,
        error: {
          code: "INVALID_TOKEN",
          message: "Token does not contain a valid user identity.",
        },
      });
      return;
    }

    const email = decodedToken.email ?? `${decodedToken.uid}@firebase.user`;
    const name = (decodedToken.name as string | undefined) ?? undefined;
    const role = (decodedToken["role"] as "ADMIN" | "REVIEWER" | "USER" | undefined) ?? "USER";

    // Idempotently provision or load Proofline User
    const userDoc = await UserService.getOrCreateUser({
      firebaseUid: decodedToken.uid,
      email,
      name,
      role,
    });

    req.user = {
      uid: decodedToken.uid,
      email: userDoc.email,
      userDoc,
    };

    next();
  } catch (error) {
    logger.warn("Firebase token verification rejected", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Provided authentication token is invalid or expired.",
      },
    });
  }
};
