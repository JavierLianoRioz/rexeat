import { z } from "zod";

const envSchema = z.object({
  // Database (Turso)
  DATABASE_URL: z.string().url(),
  DATABASE_AUTH_TOKEN: z.string().optional(),

  // Auth (Clerk)
  CLERK_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),

  // Storage (R2)
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),

  // AI
  GEMINI_API_KEY: z.string().min(1),
  DEEPL_API_KEY: z.string().min(1).optional(),

  // Realtime
  PUSHER_APP_ID: z.string().min(1),
  PUSHER_KEY: z.string().min(1),
  PUSHER_SECRET: z.string().min(1),
  PUSHER_CLUSTER: z.string().default("eu"),

  // App
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  ALLOWED_ORIGINS: z.string().optional(),
});

// En el Edge Runtime, process.env está disponible globalmente
export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
