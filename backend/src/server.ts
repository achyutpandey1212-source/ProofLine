import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { initializeFirebase } from "./config/firebase";
import { logProviderConfiguration } from "./services/aiProvider.service";
import healthRoutes from "./routes/health.routes";
import caseRoutes from "./routes/case.routes";
import evidenceRoutes from "./routes/evidence.routes";
import verificationRoutes from "./routes/verification.routes";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { logger } from "./utils/logger";

export const createApp = (): Express => {
  const app = express();

  // Security HTTP Headers
  app.use(helmet());

  // Controlled CORS configuration
  const allowedOrigins = [env.FRONTEND_URL];
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server) or matching frontend
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS policy`));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Request Body Parsers with reasonable size limits for JSON/urlencoded
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // Development HTTP Request Logging
  if (env.NODE_ENV !== "test") {
    app.use(
      morgan(env.NODE_ENV === "production" ? "combined" : "dev", {
        skip: (req) => req.url === "/health",
      })
    );
  }

  // Mount API & System Routes
  app.use(healthRoutes);
  app.use(caseRoutes);
  app.use(evidenceRoutes);
  app.use(verificationRoutes);

  // 404 & Centralized Error Handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export const startServer = async () => {
  try {
    // 1. Initialize Firebase Admin
    initializeFirebase();

    // 2. Log AI Provider Pool Configuration (without exposing secrets)
    logProviderConfiguration();

    // 3. Connect to MongoDB
    await connectDatabase();

    // 4. Create Express App
    const app = createApp();

    // 5. Start HTTP Server
    const server = app.listen(env.PORT, () => {
      logger.info(`Proofline backend server running on port ${env.PORT}`, {
        environment: env.NODE_ENV,
        port: env.PORT,
      });
    });

    // 6. Graceful Shutdown Handlers
    const handleShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        logger.info("HTTP server closed");
        await disconnectDatabase();
        process.exit(0);
      });

      // Force shutdown after timeout if pending connections hang
      setTimeout(() => {
        logger.error("Forced shutdown due to timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => handleShutdown("SIGTERM"));
    process.on("SIGINT", () => handleShutdown("SIGINT"));

    return server;
  } catch (error) {
    logger.error("Fatal error during server startup", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    process.exit(1);
  }
};

// Start server if executed directly
if (require.main === module) {
  void startServer();
}
