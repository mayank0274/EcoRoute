import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "crypto";
import logger from "../config/logger.ts";
import redis from "../db/redis.ts";

const GLOBAL_CAP = 400;
const USER_CAP = 7;

export const rateLimiterMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        let userId = req.ip;

        if (!userId) {
            return res.status(429).json({
                error: "Global limit exceeded"
            });
        }

        const date = new Date().toISOString().slice(0, 10);

        const globalKey = `global:${date}`;
        const userKey = `user:${userId}:${date}`;

        const ttl = getTTL();

        const [allowed, reason, globalRem, userRem, retryAfter] =
            (await (redis as any).rateLimit(
                globalKey,
                userKey,
                GLOBAL_CAP,
                USER_CAP,
                ttl
            )) as [number, string, number, number, number];

        res.setHeader("X-RateLimit-Global-Limit", GLOBAL_CAP);
        res.setHeader("X-RateLimit-Global-Remaining", Math.max(0, globalRem));
        res.setHeader("X-RateLimit-User-Limit", USER_CAP);
        res.setHeader("X-RateLimit-User-Remaining", Math.max(0, userRem));
        res.setHeader(
            "X-RateLimit-Reset",
            Math.floor(Date.now() / 1000) + retryAfter
        );

        if (allowed === 0) {
            res.setHeader("Retry-After", retryAfter);

            logger.info(
                `Rate limit exceeded ${JSON.stringify({
                    route: req.path,
                    reason,
                    globalRem,
                    userRem,
                })}`
            );

            return res.status(429).json({
                error:
                    reason === "global"
                        ? "Global limit exceeded"
                        : "User limit exceeded",
            });
        }

        next();
    } catch (err) {
        logger.error("Rate limiter error", err);
        next();
    }
};

function getTTL(): number {
    const now = Date.now();
    const midnight = new Date();
    midnight.setUTCHours(24, 0, 0, 0);

    return Math.floor((midnight.getTime() - now) / 1000);
}