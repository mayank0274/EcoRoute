import type { Route, RoutesResponse } from "../types/places.types.ts";
import { getCoordinatesAqiDataFromWaqi } from "../utils/getAqiData.utils.ts";
import { sampleRouteForAQI, thinByDistance } from "../utils/coordinates.sampling.utils.ts";
import type { LngLat } from "../types/geospatial.types.ts";
import { computeExposureScore, type AqiStationLike } from "../utils/aqiExposure.utils.ts";
import logger from "../config/logger.ts";

const MAX_AQI_ENRICH_DISTANCE_METERS = 250_000; // 250 km


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

    const maxRouteDistance = routes.reduce(function (max, route) {
        return Math.max(max, route.summary.lengthInMeters);
    }, 0);

    if (maxRouteDistance > MAX_AQI_ENRICH_DISTANCE_METERS) {
        logger.warn(
            `Skipping AQI enrichment: route distance ${Math.round(maxRouteDistance / 1000)}km exceeds limit ${Math.round(
                MAX_AQI_ENRICH_DISTANCE_METERS / 1000
            )}km`
        );

        return routes.map(function (route) {
            return {
                ...route,
                summary: {
                    ...route.summary,
                    avgAqi: route.summary.avgAqi ?? 0,
                    exposureScore: route.summary.exposureScore ?? null,
                    aqiReliability: route.summary.aqiReliability ?? "invalid",
                    aqiCoveredRatio: route.summary.aqiCoveredRatio ?? 0,
                },
            };
        });
    }

    // sample points per route => means divide the route in equal dist. intervals
    const sampledPerRoute = routes.map(function (route, index) {
        const sampledPoints = sampleRouteForAQI(route.geometry, route.summary.lengthInMeters);
        logger.debug(`Route ${index + 1}: sampling complete (${sampledPoints.length} points)`);
        return sampledPoints;
    });

    // merge all sampled points and thin them => used  for station fetching
    const allPoints: LngLat[] = sampledPerRoute.flat();
    const queryPoints = thinByDistance(allPoints, 3);
    logger.debug(`Station query points: ${queryPoints.length}/${allPoints.length} after thinning`);

    // fetch nearby stations to all points 
    const geoResults = await Promise.all(
        queryPoints.map(function (queryPoint) {
            return withRetry(function () {
                return getCoordinatesAqiDataFromWaqi(queryPoint);
            }).catch(function (error) {
                logger.warn(`WAQI geo feed failed for ${JSON.stringify(queryPoint)}`, error);
                return null;
            });
        })
    );

    // create a station pool
    const stationMap = new Map<string, AqiStationLike>();
    for (const stationResult of geoResults) {
        if (
            !stationResult ||
            stationResult.stationId === null ||
            stationResult.aqi === null ||
            stationResult.geo === null
        ) {
            continue;
        }

        const stationKey = `id:${stationResult.stationId}`;
        if (stationMap.has(stationKey)) continue;

        stationMap.set(stationKey, {
            stationId: stationResult.stationId,
            aqi: stationResult.aqi,
            geo: stationResult.geo,
        });
    }
    const stations = [...stationMap.values()];
    logger.info(`Shared station pool built: ${stations.length} stations`);

    // compute overall exposure score on route 
    const enrichedRoutes: Route[] = routes.map(function (route, index) {
        const sampledPointsForRoute = sampledPerRoute[index] ?? [];
        const { exposureScore, coveredRatio, reliability } = computeExposureScore({
            sampledPoints: sampledPointsForRoute,
            totalTimeSeconds: route.summary.travelTimeInSeconds,
            routeLengthMeters: route.summary.lengthInMeters,
            stations,
        });

        logger.debug(
            `Route ${index + 1}: exposure=${exposureScore}, reliability=${reliability}, coveredRatio=${coveredRatio.toFixed(2)}`
        );

        return {
            ...route,
            summary: {
                ...route.summary,
                avgAqi: exposureScore,
                exposureScore,
                aqiReliability: reliability,
                aqiCoveredRatio: coveredRatio,
            },
        };
    });

    const successfulAqi = enrichedRoutes.filter(function (route) {
        return route.summary.avgAqi !== null;
    }).length;
    logger.info(`AQI enrichment done: ${successfulAqi}/${routes.length} routes`);

    return enrichedRoutes;
};
