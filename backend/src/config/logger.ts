import winston from "winston";
import { envConfig } from "../envConfig.ts";

const isProd = envConfig.NODE_ENV === "prod";

const prodFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
)

const devFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
        format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.printf(({ level, message, timestamp }) => {
        return `${timestamp} ${level}: ${message}`;
    }))

const logger = winston.createLogger({
    level: isProd ? "info" : "debug",
    format: isProd ? prodFormat : devFormat,
    transports: [
        new winston.transports.Console(),
    ]
})

export default logger