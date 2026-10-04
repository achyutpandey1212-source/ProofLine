import admin from "firebase-admin";
import { env } from "./env";
import { logger } from "../utils/logger";

let firebaseApp: admin.app.App | null = null;

export const initializeFirebase = (): admin.app.App | null => {
  if (firebaseApp) {
    return firebaseApp;
  }

  if (admin.apps.length > 0) {
    firebaseApp = admin.apps[0] ?? null;
    return firebaseApp;
  }

  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = env;

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    logger.warn(
      "Firebase credentials are incomplete. Firebase Admin initialized in mock/unauthenticated mode."
    );
    return null;
  }

  try {
    // Correctly format private key with newline escapes
    const privateKey = FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });

    logger.info("Firebase Admin initialized successfully", {
      projectId: FIREBASE_PROJECT_ID,
    });

    return firebaseApp;
  } catch (error) {
    logger.error("Failed to initialize Firebase Admin", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return null;
  }
};

export const getFirebaseAdmin = (): admin.app.App | null => {
  if (!firebaseApp) {
    return initializeFirebase();
  }
  return firebaseApp;
};
