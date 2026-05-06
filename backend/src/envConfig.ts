import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ override: true });

const envSchema = z.object({
    PORT: z.string().transform(Number),
    NODE_ENV: z.enum(["dev", "prod"]),
    REDIS_HOST: z.string(),
    REDIS_PORT: z.string().transform(Number),
    TOMTOM_API_KEY: z.string(),
    WAQI_TOKEN: z.string(),
    CORS_ORIGIN:z.string()
});

const selectedEnv = {
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    TOMTOM_API_KEY: process.env.TOMTOM_API_KEY,
    WAQI_TOKEN: process.env.WAQI_TOKEN,
    CORS_ORIGIN:process.env.CORS_ORIGIN
};

const env = envSchema.safeParse(selectedEnv);

if (!env.success) {
    console.error("Invalid environment variables:", env.error.format());
    process.exit(1);
}

export const envConfig = env.data;