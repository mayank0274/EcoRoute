import { z } from "zod";

export const LatitudeSchema = z.number().min(-90).max(90);
export const LongitudeSchema = z.number().min(-180).max(180);

export const LngLatSchema = z.tuple([LongitudeSchema, LatitudeSchema]);
export type LngLat = z.infer<typeof LngLatSchema>;

/**
 * Standard Bounding Box: [minLng, minLat, maxLng, maxLat]
 */
export const BBoxSchema = z.tuple([LongitudeSchema, LatitudeSchema, LongitudeSchema, LatitudeSchema]);
export type BBox = z.infer<typeof BBoxSchema>;
