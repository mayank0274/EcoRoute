# EcoRoute

EcoRoute helps you find routes with the least pollution by integrating avg. air quality data (AQI) with routing services.

https://github.com/user-attachments/assets/72072594-2ff0-4096-9ac1-9010dcaee9c3

## Project Structure

-   **/client**: React frontend.
-   **/backend**: Node.js/Express backend.

## API Keys

You need keys from these services:
-   **TomTom Maps**: [developer.tomtom.com](https://developer.tomtom.com/)
-   **WAQI**: [waqi.info](https://waqi.info/)

## Setup

See [Client](./client/README.md) and [Backend](./backend/README.md) for detailed instructions.

1. Install dependencies in both folders.
2. Configure `.env.local` for development and `.env.prod` for production in the backend.
3. Run `pnpm dev` in both folders.


