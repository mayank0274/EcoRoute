import type { Route, RoutesResponse } from "../types/places.types.ts";
import { getAqiDataFromWaqi, getAvgAqi, type WaqiStation } from "../utils/getAqiData.utils.ts";
import { sampleRouteForAQI, convertSampleIntoBoundingBox } from "../utils/coordinates.sampling.utils.ts";
import type { BBox, LngLat } from "../types/geospatial.types.ts";
import logger from "../config/logger.ts";


const withRetry = async <T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000
): Promise<T> => {
    try {
        return await fn();
    } catch (error) {
        if (retries <= 0) throw error;
        logger.warn(`AQI request failed, retrying (${retries} left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return withRetry(fn, retries - 1, delay * 1.5);
    }
};

export const enrichRoutesWithAqi = async (routes: RoutesResponse): Promise<Route[]> => {
    logger.info(`AQI enrichment started for ${routes.length} routes`);

    const enrichedRoutes = await Promise.all(
        routes.map(async (route, index) => {
            try {
                const { geometry, summary } = route;

                // 1. Sample route points
                const sampledPoints = sampleRouteForAQI(geometry, summary.lengthInMeters);

                // 2. Convert samples to bounding boxes
                const bboxes = convertSampleIntoBoundingBox(sampledPoints);

                // 3. Fetch AQI data for each bounding box concurrently with retries
                const aqiPromises = bboxes.map((bbox: BBox) => {
                    return withRetry(async () => {
                        return await getAqiDataFromWaqi(bbox);
                    });
                });

                const stationsResults = await Promise.all(aqiPromises);

                // 4. Combine all stations (deduplication handled by getAvgAqi)
                const allStations: WaqiStation[] = stationsResults.flat();

                // 5. Calculate average AQI
                const avgAqi = getAvgAqi(allStations, sampledPoints);

                logger.debug(`Route ${index + 1}: ${allStations.length} stations, AQI ${avgAqi}`);

                return {
                    ...route,
                    summary: {
                        ...summary,
                        avgAqi
                    }
                };
            } catch (error) {
                logger.error(`AQI enrichment failed for route ${index + 1}`, error);
                return {
                    ...route,
                    summary: {
                        ...route.summary,
                        avgAqi: null
                    }
                };
            }
        })
    );

    const successfulAqi = enrichedRoutes.filter(r => r.summary.avgAqi !== null).length;
    logger.info(`AQI enrichment done: ${successfulAqi}/${routes.length} routes`);

    return enrichedRoutes;
};
