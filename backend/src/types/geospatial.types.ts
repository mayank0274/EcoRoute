import { z } from "zod";

export const LatitudeSchema = z.number().min(-90).max(90);
export const LongitudeSchema = z.number().min(-180).max(180);

/**
 * INTERNAL Geo-format: [longitude, latitude]
 * Matches Turf.js and GeoJSON standards.
 */
export const LngLatSchema = z.tuple([LongitudeSchema, LatitudeSchema]);
export type LngLat = z.infer<typeof LngLatSchema>;

/**
 * EXTERNAL Geo-format: [latitude, longitude]
 * Matches TomTom API and most UI inputs.
 */
export const LatLngTupleSchema = z.tuple([LatitudeSchema, LongitudeSchema]);
export type LatLngTuple = z.infer<typeof LatLngTupleSchema>;

/**
 * Standard Bounding Box: [minLng, minLat, maxLng, maxLat]
 */
export const BBoxSchema = z.tuple([LongitudeSchema, LatitudeSchema, LongitudeSchema, LatitudeSchema]);
export type BBox = z.infer<typeof BBoxSchema>;
