import * as turf from "@turf/turf";
import type { LngLat } from "../types/geospatial.types.ts";

export type AqiReliability = "high" | "medium" | "low" | "invalid";

export interface AqiStationLike {
  stationId: number;
  aqi: number;
  geo: LngLat;
}

export interface ExposureScoreResult {
  exposureScore: number | null;
  coveredRatio: number; // 0..1
  reliability: AqiReliability;
}

// penalty for bad air Normal air → unchanged Bad air → amplified
function adjustedAqi(aqi: number): number {
  if (aqi <= 150) return aqi;
  if (aqi <= 200) return aqi * 1.3;
  return aqi * 1.6;
}

function reliabilityFromCoverage(coveredRatio: number): AqiReliability {
  if (coveredRatio >= 0.8) return "high";
  if (coveredRatio >= 0.6) return "medium";
  if (coveredRatio > 0) return "low";
  return "invalid";
}

function downgradeReliability(level: AqiReliability, steps: number): AqiReliability {
  const order: AqiReliability[] = ["invalid", "low", "medium", "high"];
  const currentIndex = order.indexOf(level);
  const downgradedIndex = Math.max(0, currentIndex - steps);
  return order[downgradedIndex] ?? "invalid";
}

export function computeExposureScore(params: {
  sampledPoints: LngLat[];
  totalTimeSeconds: number;
  routeLengthMeters: number;
  stations: AqiStationLike[];
  segmentNearbyRadiusKm?: number;
  maxNearbyStations?: number;
}): ExposureScoreResult {
  const {
    sampledPoints,
    totalTimeSeconds,
    routeLengthMeters,
    stations,
    segmentNearbyRadiusKm = 4,
    maxNearbyStations = 4,
  } = params;

  if (!Number.isFinite(totalTimeSeconds) || totalTimeSeconds <= 0) {
    return { exposureScore: null, coveredRatio: 0, reliability: "invalid" };
  }

  if (!sampledPoints || sampledPoints.length < 2) {
    return { exposureScore: null, coveredRatio: 0, reliability: "invalid" };
  }

  const totalLengthKm =
    Number.isFinite(routeLengthMeters) && routeLengthMeters > 0
      ? routeLengthMeters / 1000
      : Math.max(
        0,
        sampledPoints
          .slice(0, -1)
          .reduce(function (totalDistanceKm, point, index) {
            const nextPoint = sampledPoints[index + 1];
            return totalDistanceKm + turf.distance(point, nextPoint, { units: "kilometers" });
          }, 0),
      );

  if (!Number.isFinite(totalLengthKm) || totalLengthKm <= 0) {
    return { exposureScore: null, coveredRatio: 0, reliability: "invalid" };
  }

  let coveredTime = 0;
  let totalWeighted = 0;

  for (let i = 0; i < sampledPoints.length - 1; i++) {
    const startPoint = sampledPoints[i];
    const endPoint = sampledPoints[i + 1];
    const segmentLengthKm = turf.distance(startPoint, endPoint, { units: "kilometers" });
    if (!Number.isFinite(segmentLengthKm) || segmentLengthKm <= 0) continue;

    const segmentTimeSeconds = totalTimeSeconds * (segmentLengthKm / totalLengthKm);
    if (!Number.isFinite(segmentTimeSeconds) || segmentTimeSeconds <= 0) continue;

    const segmentMidpoint = turf.midpoint(startPoint, endPoint).geometry.coordinates as LngLat;

    const nearbyStations = stations
      .map(function (station) {
        return {
          station,
          distanceKm: turf.distance(station.geo, segmentMidpoint, { units: "kilometers" }),
        };
      })
      .filter(function (candidate) {
        return (
          Number.isFinite(candidate.distanceKm) &&
          candidate.distanceKm <= segmentNearbyRadiusKm
        );
      })
      .sort(function (a, b) {
        return a.distanceKm - b.distanceKm; // sort by distance small distance 1st
      })
      .slice(0, maxNearbyStations);

    if (nearbyStations.length === 0) continue;

    let wSum = 0;
    let aqiSum = 0;

    for (const { station, distanceKm } of nearbyStations) {
      // IDW: 1 / (d + 0.5)^1.5
      const weight = 1 / Math.pow(distanceKm + 0.5, 1.5); // closer station more -> high wt
      if (!Number.isFinite(weight) || weight <= 0) continue;
      wSum += weight;
      aqiSum += station.aqi * weight;
    }

    if (wSum <= 0) continue;

    const interpolated = aqiSum / wSum; // interpolation => take nearby known values according to influence and blend them intelligently
    if (!Number.isFinite(interpolated)) continue;

    const adjusted = adjustedAqi(interpolated);
    totalWeighted += adjusted * segmentTimeSeconds;
    coveredTime += segmentTimeSeconds;
  }

  const coveredRatio = Math.max(0, Math.min(1, coveredTime / totalTimeSeconds));
  const baseReliability = reliabilityFromCoverage(coveredRatio);

  if (coveredTime <= 0) {
    return { exposureScore: null, coveredRatio, reliability: "invalid" };
  }

  let reliability = baseReliability;
  const stationCount = stations.length;
  const routeDistanceKm = totalLengthKm;

  let downgradeSteps = 0;
  if (stationCount < 3) {
    downgradeSteps += 1;
  }
  
  if (routeDistanceKm > 150) {
    downgradeSteps += 1;
  }
  
  if (downgradeSteps > 0) {
    reliability = downgradeReliability(reliability, downgradeSteps);
  }

  const exposureScore = totalWeighted / totalTimeSeconds;
  return {
    exposureScore: Number.isFinite(exposureScore) ? Math.round(exposureScore) : null,
    coveredRatio,
    reliability,
  };
}

