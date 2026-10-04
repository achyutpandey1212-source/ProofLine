import path from "path";
import dotenv from "dotenv";
import { z } from "zod";

// Load root .env if running from backend or project root
const envCandidates = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "..", ".env"),
];

for (const envPath of envCandidates) {
  dotenv.config({ path: envPath });
}

// Helper to transform comma-separated keys into a cleaned array of non-empty strings
const commaSeparatedKeysSchema = z
  .string()
  .optional()
  .transform((val) => {
    if (!val) return [];
    return val
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);
  });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  FRONTEND_URL: z.string().default("http://localhost:5173"),

  // MongoDB
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

  // Firebase Admin Credentials
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),

  // AI Providers (Pool of keys)
  GEMINI_API_KEYS: commaSeparatedKeysSchema,
  GEMINI_MODEL: z.string().default("gemini-3.8-flash"),
  GROQ_API_KEYS: commaSeparatedKeysSchema,
  GROQ_MODEL: z.string().default("llama-3.3-70b-versatile"),

  // Storage
  IMAGEKIT_PUBLIC_KEY: z.string().optional(),
  IMAGEKIT_PRIVATE_KEY: z.string().optional(),
  IMAGEKIT_URL_ENDPOINT: z.string().optional(),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errorDetails = result.error.errors
      .map((err) => `  - ${err.path.join(".")}: ${err.message}`)
      .join("\n");
    console.error(`\nEnvironment Configuration Error:\n${errorDetails}\n`);
    throw new Error("Invalid application configuration. Check environment variables.");
  }

  // In production, log warning if critical variables are missing
  if (result.data.NODE_ENV === "production") {
    if (!result.data.FIREBASE_PROJECT_ID || !result.data.FIREBASE_CLIENT_EMAIL || !result.data.FIREBASE_PRIVATE_KEY) {
      console.warn("Production warning: Firebase credentials are not fully configured.");
    }
  }

  return result.data;
};

export const env = parseEnv();
export type Env = z.infer<typeof envSchema>;
