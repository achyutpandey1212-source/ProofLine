import { UserModel, IUser } from "../models/user.model";
import { logger } from "../utils/logger";

export interface ProvisionUserParams {
  firebaseUid: string;
  email: string;
  name?: string;
  role?: "ADMIN" | "REVIEWER" | "USER";
  organization?: string;
}

export class UserService {
  /**
   * Idempotently finds an existing User by Firebase UID or provisions a new one.
   */
  public static async getOrCreateUser(params: ProvisionUserParams): Promise<IUser> {
    const { firebaseUid, email, name, role, organization } = params;

    // Fast path: find existing user
    let user = await UserModel.findOne({ firebaseUid });

    if (!user) {
      try {
        user = await UserModel.create({
          firebaseUid,
          email: email.toLowerCase(),
          name: name || undefined,
          role: role || "USER",
          organization: organization || undefined,
        });
        logger.info("New Proofline user provisioned from Firebase identity", {
          userId: user._id.toString(),
          role: user.role,
        });
      } catch (err: unknown) {
        // Handle race conditions where another concurrent request created the user
        const isDuplicateKey =
          typeof err === "object" &&
          err !== null &&
          "code" in err &&
          (err as { code: number }).code === 11000;

        if (isDuplicateKey) {
          const existing = await UserModel.findOne({ firebaseUid });
          if (existing) {
            return existing;
          }
        }
        throw err;
      }
    }

    return user;
  }

  /**
   * Find user by Firebase UID.
   */
  public static async findByFirebaseUid(firebaseUid: string): Promise<IUser | null> {
    return UserModel.findOne({ firebaseUid });
  }
}
