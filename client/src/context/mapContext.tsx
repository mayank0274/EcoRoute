import React, { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react"
import type { MapData, Route, SearchSuggestion } from "../types/map";

interface MapContextType {
    mapData: MapData;
    setSelectedSrc: (src: SearchSuggestion | null) => void;
    setSelectedDestination: (dest: SearchSuggestion | null) => void;
    setSelectedRoute: (route: Route | null) => void;
    setFetchedRoutes: (routes: Route[]) => void;
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
                }, (err) => {
                    alert("Location access denied or not supported.");
                });
            } else {
                setInitialPosition(INITIAL_POSITION);
                throw new Error("Geolocation is not supported by your browser.");
            }
        } catch (error: any) {
            setInitialPosition(INITIAL_POSITION);
            alert(error.message);
        }
    }, []);

    const setSelectedSrc = (src: SearchSuggestion | null) => {
        setMapData((prev) => ({ ...prev, selectedSrc: src }));
    };

    const setSelectedDestination = (dest: SearchSuggestion | null) => {
        setMapData((prev) => ({ ...prev, selectedDestination: dest }));
    };

    const setSelectedRoute = (route: Route | null) => {
        setMapData((prev) => ({ ...prev, selectedRoute: route }));
    };

    const setFetchedRoutes = (routes: Route[]) => {
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