import * as turf from '@turf/turf';
import type { LngLat, BBox } from '../types/geospatial.types.ts';

// Thresholds
const SAMPLING_CONFIG = {
    short: { maxMeters: 1_000, points: 5 },   // <1km  → 5 fixed points
    medium: { maxMeters: 5_000, intervalM: 200 }, // 1–5km → every 200m
    long: { maxMeters: Infinity, intervalM: 300, maxPoints: 40 }, // >5km → every 300m, capped
};

const BOUNDING_BOX_COUNT = 3;

export const sampleRouteForAQI = (
    geometry: [number, number][],   // External [lat, lon] pairs from TomTom
    lengthInMeters: number
): LngLat[] => {

    // Internal format: [lon, lat]
    const line = turf.lineString(geometry.map(([lat, lon]) => [lon, lat]));
    const totalKm = lengthInMeters / 1000;

    let targetPoints: number;
    let intervalKm: number;

    if (lengthInMeters <= SAMPLING_CONFIG.short.maxMeters) {
        targetPoints = SAMPLING_CONFIG.short.points;
        intervalKm = totalKm / (targetPoints - 1);

    } else if (lengthInMeters <= SAMPLING_CONFIG.medium.maxMeters) {
        intervalKm = SAMPLING_CONFIG.medium.intervalM / 1000;
        targetPoints = Math.floor(totalKm / intervalKm) + 1;

    } else {
        intervalKm = SAMPLING_CONFIG.long.intervalM / 1000;
        targetPoints = Math.min(
            Math.floor(totalKm / intervalKm) + 1,
            SAMPLING_CONFIG.long.maxPoints
        );
        // Recompute interval if we hit the cap
        if (targetPoints === SAMPLING_CONFIG.long.maxPoints) {
            intervalKm = totalKm / (targetPoints - 1);
        }
    }

    const sampled: LngLat[] = [];

    for (let i = 0; i < targetPoints; i++) {
        const distKm = Math.min(i * intervalKm, totalKm); // clamp last point to route end
        const pt = turf.along(line, distKm, { units: 'kilometers' });
        const [lon, lat] = pt.geometry.coordinates;
        sampled.push([lon, lat]); // Keep as [lon, lat] internal format
    }

    return sampled; // [lon, lat]
};

export const convertSampleIntoBoundingBox = (sampled: LngLat[]): BBox[] => {
    const chunks = Math.ceil(sampled.length / BOUNDING_BOX_COUNT);
    const bboxes: BBox[] = [];

    for (let i = 0; i < BOUNDING_BOX_COUNT; i++) {
        const chunk = sampled.slice(i * chunks, (i + 1) * chunks);
        if (chunk.length < 2) continue; // Turf needs at least 2 points for a lineString
        const bbox = turf.bbox(turf.lineString(chunk)) as BBox; // [minLon, minLat, maxLon, maxLat]
        bboxes.push(bbox);
    }

    return bboxes;
};