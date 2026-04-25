import { z } from "zod"

const firstValue = (value: unknown) => (Array.isArray(value) ? value[0] : value);

const parsePosition = (value: unknown) => {
    if (typeof value !== "string") {
        return value;
    }

    const parts = value.split(",").map((part) => part.trim());

    if (parts.length !== 2) {
        return value;
    }

    return parts;
};

export const placeSearchQuery = z.object({
    query: z.preprocess(firstValue, z.string().min(1, "Search query is required")),
    position: z.preprocess(parsePosition, z.tuple([z.coerce.number(), z.coerce.number()]).optional())
})

export const geocodeQuery = z.object({
    query: z.preprocess(firstValue, z.string().min(1, "Address query is required"))
})

export const reverseGeocodeQuery = z.object({
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180)
})

export const SearchSuggestionSchema = z.object({
    id: z.string(),
    name: z.string(),
    address: z.string(),
    lat: z.number(),
    lng: z.number(),
    type: z.union([z.literal("POI"), z.literal("Street")]),
    category: z.string().optional(),
    score: z.number(),
    routingPosition: z
        .object({
            lat: z.number(),
            lng: z.number(),
        })
        .optional(),
});

export const SearchSuggestionListSchema = z.array(
    SearchSuggestionSchema
);
export type SearchSuggestionList = z.infer<typeof SearchSuggestionListSchema>;
export type SearchSuggestion = z.infer<typeof SearchSuggestionSchema>;

export const routeCalculationQuery = z.object({
    src: z.preprocess(parsePosition, z.tuple([z.coerce.number().min(-90).max(90), z.coerce.number().min(-180).max(180)])),
    dest: z.preprocess(parsePosition, z.tuple([z.coerce.number().min(-90).max(90), z.coerce.number().min(-180).max(180)])),
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

export const LatLngSchema = z.object({
    lat: z.number(),
    lng: z.number()
});

export const RouteSchema = z.object({
    summary: SummarySchema,
    geometry: z.array(LatLngSchema)
});

export const RoutesResponseSchema = z.array(RouteSchema);

export type Summary = z.infer<typeof SummarySchema>;
export type LatLng = z.infer<typeof LatLngSchema>;
export type Route = z.infer<typeof RouteSchema>;
export type RoutesResponse = z.infer<typeof RoutesResponseSchema>;