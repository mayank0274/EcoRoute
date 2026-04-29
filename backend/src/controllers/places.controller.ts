import type { Request, Response } from "express";
import { asyncErrorHandler } from "../utils/asyncErrorHandler.utils.ts";
import { geocodeQuery, placeSearchQuery, reverseGeocodeQuery, routeCalculationQuery } from "../types/places.types.ts";
import { ApiError, ApiSuccessRes } from "../utils/apiResponse.utils.ts";
import type { IMapService } from "../services/mapService.interface.ts";
import { mapToSuggestions } from "../services/tomTom.service.ts";
import redis from "../db/redis.ts";
import logger from "../config/logger.ts";
import { enrichRoutesWithAqi } from "../services/aqi.service.ts";
import type { LngLat } from "../types/geospatial.types.ts";

const CACHE_TTL = 7 * 24 * 60 * 60;
const AQI_CACHE_TTL = 15 * 60;

export const createPlacesController = (mapService: IMapService) => {
    const placesSearchApi = asyncErrorHandler(async (req: Request, res: Response) => {
        const parseQuery = placeSearchQuery.safeParse(req.query);

        if (!parseQuery.success) {
            throw ApiError.validationError(parseQuery.error, "Place name is required");
        }

        const { query, lat, lng } = parseQuery.data;
        const position: LngLat | undefined = lat !== undefined && lng !== undefined ? [lng, lat] : undefined;

        const cachedData = (await redis.get(`places:${JSON.stringify({ query, position })}`));

        if (cachedData) {
            logger.info(`places:${JSON.stringify({ query, position })} Cache hit`)
            const places = JSON.parse(cachedData);
            return res.status(200).json(new ApiSuccessRes(200, "Success", { placesData: places }));
        }

        const placesData = await mapService.searchPlaces(query, position) as any;
        const suggestionsRaw = mapToSuggestions(placesData.features);

        await redis.setex(`places:${JSON.stringify({ query, position })}`, CACHE_TTL, JSON.stringify(suggestionsRaw));
        logger.info(`places:${JSON.stringify({ query, position })} Cache miss`)
        return res.status(200).json(new ApiSuccessRes(200, "Success", { placesData: suggestionsRaw }));
    });

    const placesGeocodeApi = asyncErrorHandler(async (req: Request, res: Response) => {
        const parseQuery = geocodeQuery.safeParse(req.query);

        if (!parseQuery.success) {
            throw ApiError.validationError(parseQuery.error, "Address is required");
        }

        const { query } = parseQuery.data;
        const geocodeData = await mapService.geocodeAddress(query);

        return res.status(200).json(new ApiSuccessRes(200, "Success", geocodeData));
    });

    const placesReverseGeocodeApi = asyncErrorHandler(async (req: Request, res: Response) => {
        const parseQuery = reverseGeocodeQuery.safeParse(req.query);

        if (!parseQuery.success) {
            throw ApiError.validationError(parseQuery.error, "Latitude and longitude are required");
        }

        const { lat, lng } = parseQuery.data;
        const position: LngLat = [lng, lat];

        const cachedData = (await redis.get(`reverse-geocode:${JSON.stringify(position)}`));

        if (cachedData) {
            logger.info(`reverse-geocode:${JSON.stringify(position)} Cache hit`)
            const data = JSON.parse(cachedData);
            return res.status(200).json(new ApiSuccessRes(200, "Success", data));
        }

        const reverseGeocodeData = await mapService.reverseGeocodeCoords(position);

        await redis.setex(`reverse-geocode:${JSON.stringify(position)}`, CACHE_TTL, JSON.stringify(reverseGeocodeData))
        logger.info(`reverse-geocode:${JSON.stringify(position)} Cache miss`)
        return res.status(200).json(new ApiSuccessRes(200, "Success", reverseGeocodeData));
    });

    const calculateRoute = asyncErrorHandler(async (req: Request, res: Response) => {
        const parseQuery = routeCalculationQuery.safeParse(req.query);

        if (!parseQuery.success) {
            throw ApiError.validationError(parseQuery.error, "Source and destination are required");
        }

        const { srcLat, srcLng, destLat, destLng } = parseQuery.data;

        const srcCoord: LngLat = [srcLng, srcLat];
        const destCoord: LngLat = [destLng, destLat];

        const formatCoord = (c: number) => c.toFixed(6);
        const coordsKey = `${formatCoord(srcCoord[0])},${formatCoord(srcCoord[1])}-${formatCoord(destCoord[0])},${formatCoord(destCoord[1])}`;

        const cacheKeyEnriched = `route:enriched:${coordsKey}`;
        const cacheKeyRaw = `route:raw:${coordsKey}`;

        const cachedEnriched = await redis.get(cacheKeyEnriched);
        if (cachedEnriched) {
            logger.info(`${cacheKeyEnriched} Cache hit aqi enriched route data`);
            return res.status(200).json(new ApiSuccessRes(200, "Success", JSON.parse(cachedEnriched)));
        }

        const cachedRaw = await redis.get(cacheKeyRaw);
        let rawData: any;

        if (cachedRaw) {
            logger.info(`${cacheKeyRaw} Cache hit raw route data`);
            rawData = JSON.parse(cachedRaw);
        } else {
            logger.info(`${cacheKeyRaw} Cache miss raw route data`);
            rawData = await mapService.getPossibleRoutes({ src: srcCoord, dest: destCoord });
            await redis.setex(cacheKeyRaw, CACHE_TTL, JSON.stringify(rawData));
        }

        const enrichedRoutes = await enrichRoutesWithAqi(rawData);


        await redis.setex(cacheKeyEnriched, AQI_CACHE_TTL, JSON.stringify(enrichedRoutes));
        logger.info(`${cacheKeyEnriched} Cache miss aqi enriched route data`);

        return res.status(200).json(new ApiSuccessRes(200, "Success", enrichedRoutes));
    });

    return {
        placesSearchApi,
        placesGeocodeApi,
        placesReverseGeocodeApi,
        calculateRoute,
    };
};
