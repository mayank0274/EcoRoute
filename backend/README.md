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
   Copy `.env.example` to `.env` and fill:
   - `PORT`
   - `REDIS_HOST`
   - `REDIS_PORT`
   - `TOMTOM_API_KEY`
   - `WAQI_TOKEN`
   - `NODE_ENV`

3. Run:
   ```bash
   pnpm dev
   ```

Running at `http://localhost:8000`.
