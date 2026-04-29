import type { LngLat } from "../types/geospatial.types.ts"

export interface IMapService {
    searchPlaces(query: string, position?: LngLat): Promise<unknown>;
    geocodeAddress(query: string): Promise<unknown>;
    reverseGeocodeCoords(position: LngLat): Promise<unknown>;
    getPossibleRoutes(params: { src: LngLat, dest: LngLat }): Promise<unknown>;
}
