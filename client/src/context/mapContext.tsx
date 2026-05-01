import React, { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react"
import type { MapData, SearchSuggestion, LeafletRoute } from "../types/map";
import { toast } from "sonner";

interface MapContextType {
    mapData: MapData;
    setSelectedSrc: (src: SearchSuggestion | null) => void;
    setSelectedDestination: (dest: SearchSuggestion | null) => void;
    setSelectedRoute: (route: LeafletRoute | null) => void;
    setFetchedRoutes: (routes: LeafletRoute[]) => void;
    setInitialPosition: (pos: [number, number]) => void;
}

const INITIAL_POSITION: [number, number] = [28.6139, 77.2090];
const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [mapData, setMapData] = useState<MapData>({
        initialPosition: INITIAL_POSITION,
        selectedSrc: null,
        selectedDestination: null,
        selectedRoute: null,
        fetchedRoutes: []
    });

    useEffect(() => {
        try {
            if (window.navigator) {
                window.navigator.geolocation.getCurrentPosition(async (pos) => {
                    setInitialPosition([pos.coords.latitude, pos.coords.longitude]);
                }, () => {
                    toast.error("Location access denied or not supported.");
                });
            } else {
                setInitialPosition(INITIAL_POSITION);
                throw new Error("Geolocation is not supported by your browser.");
            }
        } catch (error: any) {
            setInitialPosition(INITIAL_POSITION);
            toast.error(error.message);
        }
    }, []);

    const setSelectedSrc = (src: SearchSuggestion | null) => {
        setMapData((prev) => ({ ...prev, selectedSrc: src }));
    };

    const setSelectedDestination = (dest: SearchSuggestion | null) => {
        setMapData((prev) => ({ ...prev, selectedDestination: dest }));
    };

    const setSelectedRoute = (route: LeafletRoute | null) => {
        setMapData((prev) => ({ ...prev, selectedRoute: route }));
    };

    const setFetchedRoutes = (routes: LeafletRoute[]) => {
        setMapData((prev) => ({ ...prev, fetchedRoutes: routes }));
    };

    const setInitialPosition = (pos: [number, number]) => {
        setMapData((prev) => ({ ...prev, initialPosition: pos }));
    };

    return (
        <MapContext.Provider value={{
            mapData,
            setSelectedSrc,
            setSelectedDestination,
            setSelectedRoute,
            setFetchedRoutes,
            setInitialPosition,
        }}>
            {children}
        </MapContext.Provider>
    );
};

export const useMapContext = () => {
    const context = useContext(MapContext);
    if (context === undefined) {
        throw new Error("useMapContext must be used within a MapProvider");
    }
    return context;
};
