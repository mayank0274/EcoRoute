export interface SearchSuggestion {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: "POI" | "Street";
  category?: string;
  score: number;
  routingPosition?: {
    lat: number;
    lng: number;
  };
}

export interface MapData {
  initialPosition: [number, number];
  selectedSrc: SearchSuggestion | null;
  selectedDestination: SearchSuggestion | null;
  selectedRoute: LeafletRoute | null;
  fetchedRoutes: LeafletRoute[];
}

export type Summary = {
  lengthInMeters: number; // distance in meters

  travelTimeInSeconds: number; // ⏱ total travel time (seconds)
  trafficDelayInSeconds: number; // ⏱ delay due to traffic (seconds)
  trafficLengthInMeters: number; // distance affected by traffic (meters)

  departureTime: string; // ISO datetime
  arrivalTime: string; // ISO datetime

  noTrafficTravelTimeInSeconds: number; // ⏱ travel time without traffic (seconds)
  historicTrafficTravelTimeInSeconds: number; // ⏱ based on historical traffic (seconds)
  liveTrafficIncidentsTravelTimeInSeconds: number; // ⏱ current incidents impact (seconds)
  avgAqi: number;
  exposureScore?: number | null;
  aqiReliability?: "high" | "medium" | "low" | "invalid";
  aqiCoveredRatio?: number;
};

export type LngLat = [number, number]
export type LatLngObj = {
  lat: number,
  lng: number
}


export type Route = {
  summary: Summary;
  geometry: LngLat[];
};

export type RoutesApiResponse = Route[];

export type LeafletRoute = Omit<Route, "geometry"> & {
  geometry: LatLngObj[];
};