import React, { useEffect } from 'react';
import { MapContainer, TileLayer, ZoomControl, Polyline, CircleMarker, Tooltip, useMap, GeoJSON } from 'react-leaflet';
import indiaGeoJson from '@/assets/india-composite.geojson';
import SearchBar from '@/components/layout/SearchBar';
import RouteSheet from '@/components/layout/RouteSheet';
import { useMapContext } from '@/context/mapContext';
import 'leaflet/dist/leaflet.css';

interface MapProps {
  initialZoom?: number;
}


const MapUpdater: React.FC<{ center: [number, number]; zoom?: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || map.getZoom(), {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  }, [center, zoom, map]);
  return null;
};

const Map: React.FC<MapProps> = ({
  initialZoom = 10,
}) => {
  const { mapData, setSelectedRoute } = useMapContext();
  const { initialPosition, selectedSrc, selectedDestination, selectedRoute, fetchedRoutes } = mapData;

  const focusPosition: [number, number] | null = selectedDestination
    ? [selectedDestination.lat, selectedDestination.lng]
    : selectedSrc
      ? [selectedSrc.lat, selectedSrc.lng]
      : null;

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background font-sans">
      <div className="absolute top-0 left-0 right-0 z-[1100] p-4 flex items-start justify-between pointer-events-none gap-4">
        <div className="flex items-start gap-2.5 pointer-events-auto w-full max-w-[550px] pl-14">
          <div className="flex-1 min-w-0 flex flex-col">
            <SearchBar />
            {/* Desktop Panel */}
            <div className="hidden md:block">
              <RouteSheet />
            </div>
          </div>
        </div>
      </div>

      <MapContainer
        center={initialPosition}
        zoom={initialZoom}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {focusPosition && <MapUpdater center={focusPosition} />}

        {/* India boundary overlay */}
        <GeoJSON
          key="india-boundary"
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data={indiaGeoJson as any}
          style={{
            color: '#4ade80',
            weight: 1.5,
            opacity: 0.5,
            fillColor: '#006d42',
            fillOpacity: 0.04,
          }}
        />

        {
          fetchedRoutes.map((route, index) => {
            const isSelected = selectedRoute === route;
            return (
              <Polyline
                key={index}
                positions={route.geometry}
                pathOptions={{
                  color:  "#006d42",
                  weight: isSelected ? 6 : 4,
                  opacity: (isSelected ? 1 : 0.4),
                  lineJoin: 'round',
                  lineCap: 'round',
                }}
                eventHandlers={{
                  click: () => setSelectedRoute(route),
                }}
              />
            );
          })
        }

        {selectedSrc && (
          <CircleMarker
            center={[selectedSrc.lat, selectedSrc.lng]}
            pathOptions={{
              color: '#ffffff',
              fillColor: '#006d42',
              fillOpacity: 1,
              weight: 3
            }}
            radius={8}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={1} permanent>
              <span className="font-sans font-bold text-xs uppercase tracking-wider">{selectedSrc.name === "Unknown" ? "Starting Point" : selectedSrc.name}</span>
            </Tooltip>
          </CircleMarker>
        )}

        {selectedDestination && (
          <CircleMarker
            center={[selectedDestination.lat, selectedDestination.lng]}
            pathOptions={{
              color: '#ffffff',
              fillColor: '#7d5700',
              fillOpacity: 1,
              weight: 3
            }}
            radius={8}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={1} permanent>
              <span className="font-sans font-bold text-xs uppercase tracking-wider">{selectedDestination.name === "Unknown" ? "Destination" : selectedDestination.name}</span>
            </Tooltip>
          </CircleMarker>
        )}

        <ZoomControl position="bottomright" />
      </MapContainer>

      {/* Mobile Sheet*/}
      <div className="md:hidden">
        <RouteSheet />
      </div>
    </div>
  );
};

export default Map;


