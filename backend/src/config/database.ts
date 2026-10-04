import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "../utils/logger";

let isConnected = false;

export const connectDatabase = async (): Promise<typeof mongoose> => {
  if (isConnected) {
    logger.debug("Database already connected");
    return mongoose;
  }

  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    isConnected = true;
    logger.info("MongoDB connection established successfully", {
      host: conn.connection.host,
      database: conn.connection.name,
    });
    return conn;
  } catch (error) {
    logger.error("Failed to connect to MongoDB", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    logger.info("MongoDB disconnected gracefully");
  } catch (error) {
    logger.error("Error during MongoDB disconnection", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
