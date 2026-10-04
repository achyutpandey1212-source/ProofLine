import mongoose, { Document, Schema, Types } from "mongoose";

export interface IIdempotencyKey extends Document {
  key: string;
  userId: Types.ObjectId;
  route: string;
  statusCode: number;
  responseBody: Record<string, unknown>;
  createdAt: Date;
}

const IdempotencyKeySchema = new Schema<IIdempotencyKey>(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    route: {
      type: String,
      required: true,
      trim: true,
    },
    statusCode: {
      type: Number,
      required: true,
    },
    responseBody: {
      type: Schema.Types.Mixed,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // Automatically expire records after 24 hours (TTL index)
    },
  },
  {
    timestamps: false,
  }
);

IdempotencyKeySchema.index({ key: 1, userId: 1, route: 1 }, { unique: true });

export const IdempotencyKeyModel = mongoose.model<IIdempotencyKey>(
  "IdempotencyKey",
  IdempotencyKeySchema
);
