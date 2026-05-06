import axios from "axios";
import { envConfig } from "../envConfig.ts";
import logger from "../config/logger.ts";
import type { LngLat } from "../types/geospatial.types.ts";

export interface WaqiStation {
    lat: number;
    lon: number;
    uid: number;
    aqi: string;
    station: {
        name: string;
        time: string;
    };
}

export interface WaqiResponse {
    status: string;
    data: WaqiStation[];
}

type WaqiStatus = "ok" | string;

export interface WaqiGeoFeedForecastDay {
    avg?: number | string | null;
    day?: string;
    max?: number | string | null;
    min?: number | string | null;
}

export interface WaqiGeoFeedResponse {
    status: WaqiStatus;
    data: {
        aqi?: number | string | null;
        idx?: number | string | null;
        city?: {
            geo?: [number, number]; // [lat, lng] per WAQI
            name?: string;
        };
        forecast?: {
            daily?: {
                pm25?: WaqiGeoFeedForecastDay[];
            };
        };
    };
}

export interface WaqiGeoAqiSummary {
    stationId: number | null;
    aqi: number | null;
    city: string | null;
    geo: LngLat | null; // [lng, lat]
    forecastNext2Days: Array<{ day: string; avg: number | null }>;
}

function toNumberOrNull(value: unknown): number | null {
    if (value === null || value === undefined) return null;
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : null;
}

function getNext2DaysForecast(
    pm25: WaqiGeoFeedForecastDay[] | undefined
): Array<{ day: string; avg: number | null }> {
    const days = pm25?.filter(d => typeof d.day === "string" && d.day.length > 0) ?? [];
    if (days.length === 0) return [];

    // WAQI dates are `YYYY-MM-DD`, so string compare works for ordering.
    const today = new Date();
    const todayStr = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0"),
    ].join("-");

    const byDayAsc = [...days].sort((a, b) => (a.day as string).localeCompare(b.day as string));
    const upcoming = byDayAsc.filter(d => (d.day as string) >= todayStr);

    const chosen = (upcoming.length > 0 ? upcoming : byDayAsc)
        .slice(0, 2)
        .map(d => ({
            day: d.day as string,
            avg: toNumberOrNull(d.avg),
        }));

    return chosen;
}

export const getCoordinatesAqiDataFromWaqi = async (coordinates: LngLat): Promise<WaqiGeoAqiSummary> => {
    const [lon, lat] = coordinates;
    const token = envConfig.WAQI_TOKEN;

    const url = `https://api.waqi.info/feed/geo:${lat};${lon}?token=${token}`;
    try {
        const response = await axios.get<WaqiGeoFeedResponse>(url);

        if (response.data.status !== "ok") {
            throw new Error(`WAQI API returned status: ${response.data.status}`);
        }

        const data = response.data.data;

        const stationId = toNumberOrNull(data?.idx);
        const aqi = toNumberOrNull(data?.aqi);
        const city = typeof data?.city?.name === "string" ? data.city.name : null;

        const geoLatLng = data?.city?.geo;
        const geo: LngLat | null =
            Array.isArray(geoLatLng) && geoLatLng.length === 2
                ? [toNumberOrNull(geoLatLng[1]) ?? NaN, toNumberOrNull(geoLatLng[0]) ?? NaN]
                : null;

        const normalizedGeo =
            geo && Number.isFinite(geo[0]) && Number.isFinite(geo[1]) ? geo : null;

        const forecastNext2Days = getNext2DaysForecast(
            data?.forecast?.daily?.pm25
        );

        logger.info(`WAQI geo feed data fetched for ${JSON.stringify(coordinates)}`);

        return {
            stationId,
            aqi,
            city,
            geo: normalizedGeo,
            forecastNext2Days,
        };
    } catch (error) {
        logger.error(`WAQI geo feed fetch failed for ${JSON.stringify(coordinates)}`, error);
        throw error;
    }
};
