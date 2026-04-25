import axios from 'axios';
import { search, geocode, calculateRoute } from '@tomtom-org/maps-sdk/services';
import type { IMapService } from './mapService.interface.ts';
import type { SearchSuggestionList, SearchSuggestion } from '../types/places.types.ts';
import { envConfig } from '../envConfig.ts';
import logger from '../config/logger.ts';
import { enrichRoutesWithAqi } from './aqi.service.ts';


export function mapToSuggestions(features: any[]): SearchSuggestionList {
    return features.map((f) => {
        const props = f.properties;

        const preferredEntry = props.entryPoints?.find(
            (p: any) => p.preferredRouting
        );

        const [lng, lat] = preferredEntry?.position || f.geometry.coordinates;

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
    async searchPlaces(query: string, position?: [number, number]) {
        return search({ query, position });
    }

    async geocodeAddress(query: string) {
        return geocode({ query });
    }

    async reverseGeocodeCoords(position: [number, number]): Promise<SearchSuggestion | null> {
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
        src: [number, number];
        dest: [number, number];
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

            const routes = data.routes.map((route: any) => ({
                summary: route.summary,
                geometry: route.legs.flatMap((leg: any) =>
                    leg.points.map((p: any) => ({
                        lat: p.latitude,
                        lng: p.longitude
                    }))
                )
            }));

            const enrichedRoutes = await enrichRoutesWithAqi(routes);
            return enrichedRoutes;
        } catch (error: any) {
            logger.error("Routing API error:", error);
            throw error;
        }
    }

}
