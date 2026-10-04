import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { env } from "../config/env";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = "INTERNAL_ERROR", isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const notFoundHandler = (req: Request, res: Response, _next: NextFunction): void => {
  res.status(404).json({
    success: false,
    error: {
      code: "RESOURCE_NOT_FOUND",
      message: `The requested endpoint ${req.method} ${req.originalUrl} was not found.`,
    },
  });
};

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const errorCode = err instanceof AppError ? err.code : "INTERNAL_SERVER_ERROR";
  const message =
    err instanceof AppError
      ? err.message
      : env.NODE_ENV === "production"
      ? "An unexpected internal server error occurred."
      : err.message || "An unexpected error occurred.";

  logger.error("Unhandled error encountered", {
    method: req.method,
    url: req.originalUrl,
    code: errorCode,
    message: err.message,
    ...(env.NODE_ENV !== "production" ? { stack: err.stack } : {}),
  });

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
    },
  });
};
