import app from "./app.ts";
import { envConfig } from "./envConfig.ts";
import logger from "./config/logger.ts";
import redis from "./db/redis.ts";

const startServer = async () => {
  try {
    await redis.ping();
    logger.info("Redis connected");

    app.listen(envConfig.PORT, () => {
      logger.info(`Server running on port ${envConfig.PORT}`);
    });
  } catch (err) {
    logger.error(`Failed to start server: ${err}`);
    process.exit(1);
  }
};

startServer();
