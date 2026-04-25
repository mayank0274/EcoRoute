import axios from "axios";
import { envConfig } from "../envConfig.ts";
import logger from "../config/logger.ts";
import * as turf from '@turf/turf';
import type { LngLat, BBox } from "../types/geospatial.types.ts";

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

const MAX_RADIUS_KM = 5;

export const getAqiDataFromWaqi = async (bbox: BBox): Promise<WaqiStation[]> => {
    const [minLon, minLat, maxLon, maxLat] = bbox;
    const token = envConfig.WAQI_TOKEN;

    // WAQI API bounds format: latlng=minLat,minLon,maxLat,maxLon
    const url = `https://api.waqi.info/map/bounds/?token=${token}&latlng=${minLat},${minLon},${maxLat},${maxLon}`;
    try {
        const response = await axios.get<WaqiResponse>(url);

        if (response.data.status !== "ok") {
            throw new Error(`WAQI API returned status: ${response.data.status}`);
        }

        logger.info(`AQI data fetched successfully ${JSON.stringify(bbox)}`);
        return response.data.data;
    } catch (error) {
        logger.error(`Error fetching AQI data from WAQI ${JSON.stringify(bbox)}:`, error);
        throw error;
    }
};

export const getAvgAqi = (
    stations: WaqiStation[],
    sampledPoints: LngLat[]
): number | null => {

    const uniqueStations = Object.values(
        Object.fromEntries(stations.map(s => [s.uid, s]))
    );

    const aqiValues: number[] = [];

    sampledPoints.forEach((point) => {
        const [lon, lat] = point;

        let nearestAqi: number | null = null;
        let nearestDist = Infinity;

        uniqueStations.forEach((station) => {
            const distKm = turf.distance(
                [lon, lat],                   // [lon, lat]
                [station.lon, station.lat],   // [lon, lat]
                { units: 'kilometers' }
            );

            if (distKm < nearestDist) {
                nearestDist = distKm;
                nearestAqi = Number(station.aqi);
            }
        });

        if (nearestAqi !== null && nearestDist <= MAX_RADIUS_KM) {
            aqiValues.push(nearestAqi);
        }
    });

    if (aqiValues.length === 0) return null;

    const avg = aqiValues.reduce((sum, v) => sum + v, 0) / aqiValues.length;
    return Math.round(avg);
};