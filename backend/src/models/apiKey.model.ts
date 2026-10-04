import mongoose, { Document, Schema, Types } from "mongoose";

export interface IApiKey extends Document {
  userId: Types.ObjectId;
  keyPrefix: string;     // e.g. "pl_live_abcd" (for display/identification)
  keyHash: string;       // SHA-256 hash of the complete API key
  name: string;          // Human-readable identifier e.g. "Production ERP"
  isRevoked: boolean;
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ApiKeySchema = new Schema<IApiKey>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    keyPrefix: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    keyHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    lastUsedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const ApiKeyModel = mongoose.model<IApiKey>("ApiKey", ApiKeySchema);
