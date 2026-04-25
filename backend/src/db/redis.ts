import { Redis } from 'ioredis';
import logger from '../config/logger.ts';
import { envConfig } from '../envConfig.ts';

const redis = new Redis({
    host: envConfig.REDIS_HOST || 'localhost',
    port: Number(envConfig.REDIS_PORT) || 6379,
    retryStrategy: (times) => {
        if (times > 10) return null;
        return Math.min(times * 100, 3000);
    },
    maxRetriesPerRequest: 3,
    enableOfflineQueue: true,
});

redis.on('error', (err) => {
    logger.error(`Redis error: ${err.message}`);
    process.exit(1);
});

export default redis;