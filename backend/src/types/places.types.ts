import { z } from "zod"
import { LatitudeSchema, LongitudeSchema, LngLatSchema } from "./geospatial.types.ts";

export const placeSearchQuery = z.object({
    query: z.string().min(1, "Search query is required"),
    lat: z.coerce.number().pipe(LatitudeSchema).optional(),
    lng: z.coerce.number().pipe(LongitudeSchema).optional(),
})

export const geocodeQuery = z.object({
    query: z.string().min(1, "Address query is required")
})

export const reverseGeocodeQuery = z.object({
    lat: z.coerce.number().pipe(LatitudeSchema),
    lng: z.coerce.number().pipe(LongitudeSchema)
})

export const SearchSuggestionSchema = z.object({
    id: z.string(),
    name: z.string(),
    address: z.string(),
    lat: LatitudeSchema,
    lng: LongitudeSchema,
    type: z.union([z.literal("POI"), z.literal("Street")]),
    category: z.string().optional(),
    score: z.number(),
    routingPosition: z
        .object({
            lat: LatitudeSchema,
            lng: LongitudeSchema,
        })
        .optional(),
});

export const SearchSuggestionListSchema = z.array(
    SearchSuggestionSchema
);
export type SearchSuggestionList = z.infer<typeof SearchSuggestionListSchema>;
export type SearchSuggestion = z.infer<typeof SearchSuggestionSchema>;

export const routeCalculationQuery = z.object({
    srcLat: z.coerce.number().pipe(LatitudeSchema),
    srcLng: z.coerce.number().pipe(LongitudeSchema),
    destLat: z.coerce.number().pipe(LatitudeSchema),
    destLng: z.coerce.number().pipe(LongitudeSchema),
});

export const SummarySchema = z.object({
    lengthInMeters: z.number(), // distance in meters

    travelTimeInSeconds: z.number(), // ⏱ total travel time (seconds)
    trafficDelayInSeconds: z.number(), // ⏱ delay due to traffic (seconds)
    trafficLengthInMeters: z.number(), // distance affected by traffic (meters)

    departureTime: z.string(), // ISO datetime
    arrivalTime: z.string(), // ISO datetime

    noTrafficTravelTimeInSeconds: z.number(), // ⏱ travel time without traffic (seconds)
    historicTrafficTravelTimeInSeconds: z.number(), // ⏱ based on historical traffic (seconds)
    liveTrafficIncidentsTravelTimeInSeconds: z.number(), // ⏱ current incidents impact (seconds),
    avgAqi: z.number().nullable().optional(),
});


export const RouteSchema = z.object({
    summary: SummarySchema,
    geometry: z.array(LngLatSchema)
});

export const RoutesResponseSchema = z.array(RouteSchema);

export type Summary = z.infer<typeof SummarySchema>;
export type Route = z.infer<typeof RouteSchema>;
export type RoutesResponse = z.infer<typeof RoutesResponseSchema>;
