import type { Request, Response } from "express";
import { asyncErrorHandler } from "../utils/asyncErrorHandler.utils.ts";
import { geocodeQuery, placeSearchQuery, reverseGeocodeQuery, routeCalculationQuery } from "../types/places.types.ts";
import { ApiError, ApiSuccessRes } from "../utils/apiResponse.utils.ts";
import type { IMapService } from "../services/mapService.interface.ts";
import { mapToSuggestions } from "../services/tomTom.service.ts";
import redis from "../db/redis.ts";
import logger from "../config/logger.ts";
import { enrichRoutesWithAqi } from "../services/aqi.service.ts";

const CACHE_TTL = 7 * 24 * 60 * 60;

export const createPlacesController = (mapService: IMapService) => {
    const placesSearchApi = asyncErrorHandler(async (req: Request, res: Response) => {
        const parseQuery = placeSearchQuery.safeParse(req.query);

        if (!parseQuery.success) {
            throw ApiError.validationError(parseQuery.error, "Place name is required");
        }

        const { query, position } = parseQuery.data;

        const cachedData = (await redis.get(`places:${JSON.stringify({ query, position })}`));

        if (cachedData) {
            logger.info(`places:${JSON.stringify({ query, position })} Cache hit`)
            const places = JSON.parse(cachedData);
            return res.status(200).json(new ApiSuccessRes(200, "Success", { placesData: places }));
        }

        const placesData = await mapService.searchPlaces(query, position) as any;
        const suggestionsRaw = mapToSuggestions(placesData.features);
        // const suggestionsRaw = [
        //     {
        //         "id": "HBfS3NLTYc_4G_xskTtH8A",
        //         "name": "Indira Gandhi International Airport",
        //         "address": "IGI Airport Terminal 2 Road, Panchvati Palam, Samalkha Village Kapas Hera, New Delhi 110037, Delhi",
        //         "lat": 28.55549,
        //         "lng": 77.08542,
        //         "type": "POI",
        //         "category": "PUBLIC_AIRPORT",
        //         "score": 6.9512162209,
        //         "routingPosition": {
        //             "lat": 28.55549,
        //             "lng": 77.08542
        //         }
        //     },
        //     {
        //         "id": "wg2U86-Ka_9yE4JXiaz92A",
        //         "name": "Hitesh Igi Airport",
        //         "address": "Main Brijpuri Road, Maha Laxmi Enclave, Mustafabad, New Delhi 110090, Delhi",
        //         "lat": 28.71567,
        //         "lng": 77.27796,
        //         "type": "POI",
        //         "category": "TOURIST_ATTRACTION",
        //         "score": 6.54028368,
        //         "routingPosition": {
        //             "lat": 28.71567,
        //             "lng": 77.27796
        //         }
        //     },
        //     {
        //         "id": "xrz9JYR9mppKGWYdn_mwAQ",
        //         "name": "Hotel Bonito - Delhi IGI Airport",
        //         "address": "Indira Gandhi Airport Road, Sector 8, Palam, New Delhi 110077, Delhi",
        //         "lat": 28.56173,
        //         "lng": 77.07282,
        //         "type": "POI",
        //         "category": "HOTEL",
        //         "score": 6.4247546196,
        //         "routingPosition": {
        //             "lat": 28.56173,
        //             "lng": 77.07282
        //         }
        //     },
        //     {
        //         "id": "UDEaS3u71H4fPZu0J12GCg",
        //         "name": "IGI Airport 1D Road",
        //         "address": "IGI Airport 1D Road, New Delhi, Delhi",
        //         "lat": 28.563847,
        //         "lng": 77.123551,
        //         "type": "Street",
        //         "score": 6.4095516205
        //     },
        //     {
        //         "id": "GVBrU0rlrXKG52SpWhOdDw",
        //         "name": "Hotel Renox Suites Delhi IGI Airport",
        //         "address": "Swarna Jayanti Marg, Panchvati Palam, Samalkha Village Kapas Hera, New Delhi 110037, Delhi",
        //         "lat": 28.55328,
        //         "lng": 77.1296,
        //         "type": "POI",
        //         "category": "B_B_GUEST_HOUSE",
        //         "score": 6.3641438484,
        //         "routingPosition": {
        //             "lat": 28.55328,
        //             "lng": 77.1296
        //         }
        //     },
        //     {
        //         "id": "j0ZF2FKkmKxoJBRHI68alA",
        //         "name": "IGI Airport Terminal 2 Road",
        //         "address": "IGI Airport Terminal 2 Road, Panchvati Palam, Samalkha Village Kapas Hera, New Delhi 110037, Delhi",
        //         "lat": 28.556281,
        //         "lng": 77.094449,
        //         "type": "Street",
        //         "score": 6.3034415245
        //     },
        //     {
        //         "id": "QbKeRvZlr2_upb2gBMv69w",
        //         "name": "T1D IGI Airport Delhi",
        //         "address": "IGI Airport 1D Road, Sekhon Vihar, Palam, New Delhi 110037, Delhi",
        //         "lat": 28.56237,
        //         "lng": 77.11996,
        //         "type": "POI",
        //         "category": "TRAVEL_AGENT",
        //         "score": 6.2899689674,
        //         "routingPosition": {
        //             "lat": 28.56237,
        //             "lng": 77.11996
        //         }
        //     },
        //     {
        //         "id": "WhVCGieofurV4h63fD8TyA",
        //         "name": "Hotel Olive Aero Suites Near Delhi Igi Airport",
        //         "address": "A-6, Mahipalpur Mehrauli Marg, Panchvati Palam, Samalkha Village Kapas Hera, New Delhi 110037, Delhi",
        //         "lat": 28.54841,
        //         "lng": 77.12578,
        //         "type": "POI",
        //         "category": "HOTEL",
        //         "score": 6.2462887764,
        //         "routingPosition": {
        //             "lat": 28.54841,
        //             "lng": 77.12578
        //         }
        //     },
        //     {
        //         "id": "cgg87Zd8TDXbSjH67tTBzQ",
        //         "name": "IGI Airport",
        //         "address": "IGI T3 Road, Panchvati Palam, Samalkha Village Kapas Hera, New Delhi 110037, Delhi",
        //         "lat": 28.55652,
        //         "lng": 77.08672,
        //         "type": "POI",
        //         "category": "SUBWAY_STATION",
        //         "score": 6.2128863335,
        //         "routingPosition": {
        //             "lat": 28.55652,
        //             "lng": 77.08672
        //         }
        //     },
        //     {
        //         "id": "VcPBPenvMKP_yqpyAC-PgA",
        //         "name": "The Grid Bar IGI Airport Delhi",
        //         "address": "Nangal Dewat Road, Panchvati Palam, Samalkha Village Kapas Hera, New Delhi 110037, Delhi",
        //         "lat": 28.55343,
        //         "lng": 77.08541,
        //         "type": "POI",
        //         "category": "TRAVEL_AGENT",
        //         "score": 6.1896576881,
        //         "routingPosition": {
        //             "lat": 28.55343,
        //             "lng": 77.08541
        //         }
        //     }
        // ]

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

        const cachedData = (await redis.get(`reverse-geocode:${JSON.stringify([lat, lng])}`));

        if (cachedData) {
            logger.info(`reverse-geocode:${JSON.stringify([lat, lng])} Cache hit`)
            const data = JSON.parse(cachedData);
            return res.status(200).json(new ApiSuccessRes(200, "Success", data));
        }

        const reverseGeocodeData = await mapService.reverseGeocodeCoords([lng, lat]);

        await redis.setex(`reverse-geocode:${JSON.stringify([lat, lng])}`, CACHE_TTL, JSON.stringify(reverseGeocodeData))
        logger.info(`reverse-geocode:${JSON.stringify([lat, lng])} Cache miss`)
        return res.status(200).json(new ApiSuccessRes(200, "Success", reverseGeocodeData));
    });

    const calculateRoute = asyncErrorHandler(async (req: Request, res: Response) => {
        const parseQuery = routeCalculationQuery.safeParse(req.query);

        if (!parseQuery.success) {
            throw ApiError.validationError(parseQuery.error, "Source and destination are required");
        }

        const { src, dest } = parseQuery.data;

        // Coordinates in TomTom services are [lng, lat]
        const srcCoord: [number, number] = [src[1], src[0]];
        const destCoord: [number, number] = [dest[1], dest[0]];

        const cacheKey = `route:${srcCoord.join(",")}-${destCoord.join(",")}`;
        const cachedData = await redis.get(cacheKey);

        if (cachedData) {
            logger.info(`${cacheKey} Cache hit`);
            const data = JSON.parse(cachedData);
            const enrich = await enrichRoutesWithAqi(data);
            return res.status(200).json(new ApiSuccessRes(200, "Success", enrich));
        }

        const routeData = await mapService.getPossibleRoutes({ src: srcCoord, dest: destCoord });

        await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(routeData));
        logger.info(`${cacheKey} Cache miss`);

        return res.status(200).json(new ApiSuccessRes(200, "Success", routeData));
    });

    return {
        placesSearchApi,
        placesGeocodeApi,
        placesReverseGeocodeApi,
        calculateRoute,
    };
};
