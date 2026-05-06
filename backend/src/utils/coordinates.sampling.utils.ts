import * as turf from "@turf/turf";
import type { LngLat } from "../types/geospatial.types.ts";


const SAMPLING_CONFIG = {
  short: { maxMeters: 1_000, points: 5 }, // <1km  → 5 fixed points
  medium: { maxMeters: 5_000, intervalM: 200 }, // 1–5km → every 200m
  long: { maxMeters: Infinity, intervalM: 300, maxPoints: 40 }, // >5km → every 300m, capped
};

export const sampleRouteForAQI = (
  geometry: LngLat[],
  lengthInMeters: number,
): LngLat[] => {
  const line = turf.lineString(geometry);
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
      SAMPLING_CONFIG.long.maxPoints,
    );
    // Recompute interval if we hit the cap
    if (targetPoints === SAMPLING_CONFIG.long.maxPoints) {
      intervalKm = totalKm / (targetPoints - 1);
    }
  }

  const sampled: LngLat[] = [];

  for (let i = 0; i < targetPoints; i++) {
    const distKm = Math.min(i * intervalKm, totalKm); // clamp last point to route end
    const pt = turf.along(line, distKm, { units: "kilometers" });
    const [lng, lat] = pt.geometry.coordinates;
    sampled.push([lng, lat]); // Keep as [lng, lat] internal format
  }

  return sampled; // [lng, lat]
};

export const thinByDistance = (points: LngLat[], minDistanceKm: number): LngLat[] => {
  if (points.length === 0) return [];
  if (!Number.isFinite(minDistanceKm) || minDistanceKm <= 0) return points;

  const kept: LngLat[] = [];

  for (const candidatePoint of points) {
    if (kept.length === 0) {
      kept.push(candidatePoint);
      continue;
    }

    const isTooCloseToAnyKeptPoint = kept.some(function (keptPoint) {
      return (
        turf.distance(keptPoint, candidatePoint, { units: "kilometers" }) < minDistanceKm
      );
    });

    if (!isTooCloseToAnyKeptPoint) kept.push(candidatePoint);
  }

  // do npt over thin keep enough points to form a station pool.
  return kept.length < 5 ? points : kept;
};


// Tolerance for simlify large geometry ararays
export function getTolerance(distanceMeters: number) {
  // Skip small routes → not worth simplifying
  if (distanceMeters < 10000) return 0;

  const errorRatio = 0.001; // allow 0.1% deviation from total length

  // allowed error in meters (e.g. 100km route → 100m deviation allowed)
  const allowedErrorMeters = distanceMeters * errorRatio;

  // Convert meters → degrees because Turf expects coordinates in degrees
  // 1 degree latitude ≈ 111,000 meters
  const tolerance = allowedErrorMeters / 111000;

  // Limit max deviation (~100m) so long routes don't get distorted
  return Math.min(tolerance, 0.001);
}
