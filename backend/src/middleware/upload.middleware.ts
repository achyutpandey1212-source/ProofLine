import multer from "multer";
import { Request } from "express";
import { AppError } from "../middleware/error.middleware";

// Max file size: 10MB per evidence item
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

// Supported MIME types for evidence
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `Unsupported file type: ${file.mimetype}. Allowed types: JPEG, PNG, WEBP, PDF.`,
        415,
        "UNSUPPORTED_MEDIA_TYPE"
      )
    );
  }
};

// Use memory storage to process uploads directly to ImageKit without touching disk
const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1, // Only 1 file per upload request
  },
  fileFilter,
});
