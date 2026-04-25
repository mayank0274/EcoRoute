export interface IMapService {
    searchPlaces(query: string, position?: [number, number]): Promise<unknown>;
    geocodeAddress(query: string): Promise<unknown>;
    reverseGeocodeCoords(position: [number, number]): Promise<unknown>;
    getPossibleRoutes(params: { src: [number, number], dest: [number, number] }): Promise<unknown>;
}
