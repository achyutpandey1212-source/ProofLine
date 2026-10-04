import ImageKit from "imagekit";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { AppError } from "../middleware/error.middleware";

export interface ImageKitUploadResult {
  fileId: string;
  url: string;
  name: string;
  size: number;
  filePath: string;
}

export class ImageKitService {
  private static client: ImageKit | null = null;

  private static getClient(): ImageKit {
    if (this.client) {
      return this.client;
    }

    const { IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT } = env;

    if (!IMAGEKIT_PUBLIC_KEY || !IMAGEKIT_PRIVATE_KEY || !IMAGEKIT_URL_ENDPOINT) {
      logger.error("ImageKit credentials are not configured in environment");
      throw new AppError("Storage service unavailable.", 503, "STORAGE_CONFIG_ERROR");
    }

    this.client = new ImageKit({
      publicKey: IMAGEKIT_PUBLIC_KEY,
      privateKey: IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: IMAGEKIT_URL_ENDPOINT,
    });

    return this.client;
  }

  /**
   * Upload a buffer to ImageKit under proofline/cases/<caseId>/evidence/
   */
  public static async uploadFile(params: {
    fileBuffer: Buffer;
    fileName: string;
    caseId: string;
  }): Promise<ImageKitUploadResult> {
    const client = this.getClient();
    const folder = `/proofline/cases/${params.caseId}/evidence`;

    try {
      logger.info("Uploading file to ImageKit", {
        caseId: params.caseId,
        fileName: params.fileName,
      });

      const response = await client.upload({
        file: params.fileBuffer,
        fileName: params.fileName,
        folder,
        useUniqueFileName: true,
      });

      return {
        fileId: response.fileId,
        url: response.url,
        name: response.name,
        size: response.size,
        filePath: response.filePath,
      };
    } catch (err) {
      logger.error("Failed to upload file to ImageKit", {
        caseId: params.caseId,
        error: err instanceof Error ? err.message : "Unknown error",
      });
      throw new AppError("Failed to upload file to storage provider.", 502, "STORAGE_UPLOAD_ERROR");
    }
  }

  /**
   * Deletes a file from ImageKit. Used for cleanup if MongoDB persistence fails.
   */
  public static async deleteFile(fileId: string): Promise<void> {
    const client = this.getClient();
    try {
      logger.info("Attempting ImageKit file cleanup/deletion", { fileId });
      await client.deleteFile(fileId);
      logger.info("ImageKit file cleaned up successfully", { fileId });
    } catch (err) {
      logger.error("Failed to delete orphaned file from ImageKit during cleanup", {
        fileId,
        error: err instanceof Error ? err.message : "Unknown error",
      });
      // Do not rethrow during cleanup so the caller can return the primary failure
    }
  }
}
