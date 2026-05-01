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

redis.defineCommand("rateLimit", {
    numberOfKeys: 2,
    lua: `
    local globalKey = KEYS[1]
    local userKey = KEYS[2]

    local globalLimit = tonumber(ARGV[1])
    local userLimit = tonumber(ARGV[2])
    local ttl = tonumber(ARGV[3])

    -- increment both
    local globalCount = redis.call("INCR", globalKey)
    local userCount = redis.call("INCR", userKey)

    -- set expiry only once
    if globalCount == 1 then
      redis.call("EXPIRE", globalKey, ttl)
    end

    if userCount == 1 then
      redis.call("EXPIRE", userKey, ttl)
    end

    -- compute remaining
    local globalRemaining = globalLimit - globalCount
    local userRemaining = userLimit - userCount

    -- get ttl (same for both ideally)
    local ttlLeft = redis.call("TTL", globalKey)

    -- check limits
    if globalCount > globalLimit then
      return {0, "global", globalRemaining, userRemaining, ttlLeft}
    end

    if userCount > userLimit then
      return {0, "user", globalRemaining, userRemaining, ttlLeft}
    end

    return {1, "ok", globalRemaining, userRemaining, ttlLeft}
  `,
});


export default redis;