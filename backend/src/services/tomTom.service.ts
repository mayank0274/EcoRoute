import axios from 'axios';
import { search, geocode } from '@tomtom-org/maps-sdk/services';
import type { IMapService } from './mapService.interface.ts';
import type { SearchSuggestionList, SearchSuggestion } from '../types/places.types.ts';
import { envConfig } from '../envConfig.ts';
import logger from '../config/logger.ts';
import { enrichRoutesWithAqi } from './aqi.service.ts';
import type { LngLat } from '../types/geospatial.types.ts';
import * as turf from '@turf/turf';
import { getTolerance } from '../utils/coordinates.sampling.utils.ts';


export function mapToSuggestions(features: any[]): SearchSuggestionList {
    return features.map((f) => {
        const props = f.properties;

        const preferredEntry = props.entryPoints?.find(
            (p: any) => p.preferredRouting
        );

        const coordinate = preferredEntry?.position
            ? [preferredEntry.position[1], preferredEntry.position[0]]
            : f.geometry.coordinates;
        const [lng, lat] = coordinate;

        return {
            id: f.id,
            name: props.poi?.name || props.address?.streetName || "Unknown",
            address: props.address?.freeformAddress || "",
            lat,
            lng,
            type: props.type,
            category: props.poi?.categories?.[0],
            score: props.score,
            routingPosition: preferredEntry
                ? { lat: preferredEntry.position[1], lng: preferredEntry.position[0] }
                : undefined,
        };
    });
}

export class TomTomService implements IMapService {
    async searchPlaces(query: string, position?: LngLat) {
        const searchPosition = position ? [position[1], position[0]] as [number, number] : undefined;
        return search({ query, position: searchPosition });
    }

    async geocodeAddress(query: string) {
        return geocode({ query });
    }

    async reverseGeocodeCoords(position: LngLat): Promise<SearchSuggestion | null> {
        const [lng, lat] = position;
        const apiKey = envConfig.TOMTOM_API_KEY;
        const url = `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lng}.json?key=${apiKey}&radius=100`;

        try {
            const response = await axios.get(url);
            const data = response.data;

            if (!data.addresses || data.addresses.length === 0) {
                return null;
            }

            const topResult = data.addresses[0];
            const [posLat, posLng] = topResult.position.split(',').map(parseFloat);

            return {
                id: topResult.id,
                name: topResult.address.localName || topResult.address.streetName || "Unknown",
                address: topResult.address.freeformAddress,
                lat: posLat,
                lng: posLng,
                type: "Street",
                score: 1,
                routingPosition: {
                    lat: posLat,
                    lng: posLng
                }
            };
        } catch (error) {
            logger.error("Reverse geocoding error:", error);
            throw error;
        }
    }

    async getPossibleRoutes({
        src,
        dest
    }: {
        src: LngLat;
        dest: LngLat;
    }) {
        const [srcLng, srcLat] = src;
        const [destLng, destLat] = dest;

        const apiKey = envConfig.TOMTOM_API_KEY;

        const url = `https://api.tomtom.com/routing/1/calculateRoute/${srcLat},${srcLng}:${destLat},${destLng}/json`;

        try {
            const response = await axios.get(url, {
                params: {
                    key: apiKey,
                    maxAlternatives: 1,
                    travelMode: "car",
                    routeType: "fastest",
                    traffic: true,
                    computeTravelTimeFor: "all",
                    routeRepresentation: "polyline",
                }
            });

            const data = response.data;

            if (!data.routes || data.routes.length === 0) {
                return [];
            }

            const routes = data.routes.map((route: any) => {
                const geometry: [number, number][] = [];

                for (const leg of route.legs) {
                    if (!Array.isArray(leg.points)) continue;
                    for (const p of leg.points) {
                        geometry.push([p.longitude, p.latitude]);
                    }
                }

                return {
                    summary: route.summary,
                    geometry
                };
            });

            const enrichedRoutes = await enrichRoutesWithAqi(routes);

            return enrichedRoutes.map(({ summary, geometry }) => {
                const line = turf.lineString(geometry);
                const simplified = turf.simplify(line, {
                    tolerance: getTolerance(summary.lengthInMeters),
                });
                return {
                    summary,
                    geometry: simplified.geometry.coordinates
                }
            });

        } catch (error: any) {
            logger.error("Routing API error:", error);
            throw error;
        }
    }

}
