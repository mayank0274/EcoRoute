import dotenv from "dotenv";
import { z } from "zod";
import path from "path";

dotenv.config({ override: true,path: path.resolve(
    process.cwd(),
    process.env.NODE_ENV === "prod"
      ? ".env.prod"
      : ".env.local"
  ),});

const envSchema = z.object({
    PORT: z.string().transform(Number),
    NODE_ENV: z.enum(["dev", "prod"]),
    REDIS_HOST: z.string(),
    REDIS_PORT: z.string().transform(Number),
    TOMTOM_API_KEY: z.string(),
    WAQI_TOKEN: z.string(),
    CORS_ORIGIN:z.string(),
    UPSTASH_REDIS_USERNAME:z.string().optional(),
    UPSTASH_REDIS_PASSWORD:z.string().optional(),
    CLIENT_URL:z.string().optional()
});

const selectedEnv = {
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    TOMTOM_API_KEY: process.env.TOMTOM_API_KEY,
    WAQI_TOKEN: process.env.WAQI_TOKEN,
    CORS_ORIGIN:process.env.CORS_ORIGIN,
    UPSTASH_REDIS_PASSWORD:process.env.UPSTASH_REDIS_PASSWORD,
    UPSTASH_REDIS_USERNAME:process.env.UPSTASH_REDIS_USERNAME,
    CLIENT_URL:process.env.CLIENT_URL
};

const env = envSchema.safeParse(selectedEnv);

if (!env.success) {
    console.error("Invalid environment variables:", env.error.format());
    process.exit(1);
}


if (env.data.NODE_ENV === "prod") {
    if (!env.data.UPSTASH_REDIS_USERNAME) {
      throw new Error("Missing UPSTASH_REDIS_USERNAME");
      process.exit(1);
    }
  
    if (!env.data.UPSTASH_REDIS_PASSWORD) {
      throw new Error("Missing UPSTASH_REDIS_PASSWORD");
      process.exit(1);
    }
  }

export const envConfig = env.data;