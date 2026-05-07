# EcoRoute - Backend

Node.js backend for EcoRoute.

## API Keys

You need keys from these services:
-   **TomTom Maps**: [developer.tomtom.com](https://developer.tomtom.com/)
-   **WAQI**: [waqi.info](https://waqi.info/)

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Environment Variables:
   Create the environment file for the mode you want to run:
   - `.env.local` for development (`NODE_ENV=dev`)
   - `.env.prod` for production (`NODE_ENV=prod`)

   Both files should include:
   - `PORT`
   - `REDIS_HOST`
   - `REDIS_PORT`
   - `TOMTOM_API_KEY`
   - `WAQI_TOKEN`
   - `NODE_ENV`
   - `CORS_ORIGIN`

   When running in production, also set:
   - `UPSTASH_REDIS_USERNAME`
   - `UPSTASH_REDIS_PASSWORD`

3. Run:
   ```bash
   pnpm dev
   ```

Running at `http://localhost:8000`.
