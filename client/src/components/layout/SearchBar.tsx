import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Circle, Loader2, Search, XCircle, ArrowRight, LocateFixed } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/http/api';
import { useDeboucedValue } from '@/hooks/useDeboucedValue';
import { mapTomTomCategory, categoryIconMap } from '@/utils/placesCategory';
import type { LeafletRoute, RoutesApiResponse, SearchSuggestion } from '@/types/map';
import { useMapContext } from '@/context/mapContext';
import { formatLngLatGeometry } from '@/utils/routeDetails';
import { toast } from 'sonner';

interface IPlaceSearchInput {
  placeholder: string,
  icon: React.ReactNode,
  updateRouteData: (position: SearchSuggestion | null) => void
  value: string
}

const PlaceSearchInput = ({ placeholder, icon, updateRouteData, value }: IPlaceSearchInput) => {
  const [searchQuery, setSearchQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDeboucedValue(searchQuery, 800);
  const containerRef = useRef<HTMLDivElement>(null);
  const isSelected = useRef(false);

  const {
    data: placesData = [],
    isFetching: isSearching,
    isError,
  } = useQuery<SearchSuggestion[]>({
    queryKey: ["places-search", debouncedQuery],
    queryFn: async ({ queryKey }) => {
      const [, query] = queryKey;
      if (!query) return [];

      const res = await api.get(
        `/places/search?query=${encodeURIComponent(query as string)}`
      );
      const result = res.data.data.details
      return result.placesData ?? [];
    },
    enabled: debouncedQuery.trim().length > 0 && !isSelected.current,
    staleTime: 1000 * 60 * 5,
  });


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (place: SearchSuggestion) => {
    setSearchQuery(place.address);
    updateRouteData(place);
    setIsOpen(false);
    isSelected.current = true;
  };

  const userCoordsRef = useRef<{ lat: number, lng: number } | null>(null);

  const {
    isFetching: isReverseGeocoding,
    refetch: triggerReverseGeocode,
  } = useQuery<SearchSuggestion>({
    queryKey: ["reverse-geocode"],
    queryFn: async () => {
      const coords = userCoordsRef.current;
      if (!coords) return null;
      const res = await api.get(
        `/places/reverse-geocode?lat=${coords.lat}&lng=${coords.lng}`
      );
      return res.data.data.details;
    },
    enabled: false,
  });

  const geoCodeUserLocation = () => {
    try {
      if (window.navigator) {
        window.navigator.geolocation.getCurrentPosition(async (pos) => {
          userCoordsRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          const { data } = await triggerReverseGeocode();
          if (data) {
            handleSelect(data);
            userCoordsRef.current = null; // Clean up
          }
        }, () => {
          toast.error("Location access denied or not supported.");
        });
      } else {
        throw new Error("Geolocation is not supported by your browser.");
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className='flex flex-col relative w-full' ref={containerRef}>
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center">
          <div className="p-0.5">
            {icon}
          </div>
        </div>
        <Input
          value={searchQuery}
          placeholder={placeholder}
          className="border-none shadow-none focus-visible:ring-0 text-title-sm font-bold bg-transparent h-10 p-0 placeholder:text-muted-foreground/40 w-full"
          onChange={(e) => {
            isSelected.current = false;
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {searchQuery && (
          <button
            onClick={() => { setSearchQuery(""); updateRouteData(null); }}
            className="text-muted-foreground/30 hover:text-muted-foreground transition-colors"
          >
            <XCircle size={16} />
          </button>
        )}
        <button
          onClick={geoCodeUserLocation}
          disabled={isReverseGeocoding}
          className="hover:text-primary transition-colors disabled:opacity-50"
          title='Set my current location'
        >
          {isReverseGeocoding ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <LocateFixed size={18} />
          )}
        </button>
      </div>

      {isOpen && (searchQuery.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-surface-container-lowest border border-border/40 rounded-xl shadow-ambient overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-[300px] overflow-y-auto overflow-x-hidden py-2 custom-scrollbar">
            {isSearching ? (
              <div className="flex items-center justify-center p-8 text-muted-foreground">
                <Loader2 className="animate-spin mr-2" size={18} />
                <span className="text-label-md">Finding places...</span>
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center p-6 text-destructive text-center">
                <XCircle className="mb-2 opacity-50" size={24} />
                <p className="text-label-md font-semibold">Error loading results</p>
              </div>
            ) : placesData.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-muted-foreground text-center">
                <Search className="mb-2 opacity-20" size={24} />
                <p className="text-label-md opacity-60">No results found for "{searchQuery}"</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {placesData.map((place) => {
                  const category = mapTomTomCategory(place.category);
                  const Icon = categoryIconMap[category];

                  return (
                    <button
                      key={place.id}
                      onClick={() => handleSelect(place)}
                      className="w-full flex items-start gap-4 p-3 hover:bg-surface-container transition-colors text-left group"
                    >
                      <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary transition-transform group-hover:scale-110">
                        <Icon size={16} />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-title-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {place.address}
                        </span>
                        {
                          place.name != "Unknown" && <span className="text-label-sm text-muted-foreground truncate opacity-70 group-hover:opacity-100 transition-opacity">
                            {place.name}
                          </span>
                        }
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SearchBar: React.FC = () => {
  const { mapData, setSelectedSrc, setSelectedDestination, setFetchedRoutes, setSelectedRoute } = useMapContext();

  const { data: routeData, isLoading: isFetchingRoute, refetch: getRoute } = useQuery({
    queryKey: ["route", mapData.selectedSrc?.id, mapData.selectedDestination?.id],
    queryFn: async () => {
      if (!mapData.selectedSrc || !mapData.selectedDestination) return null;
      const res = await api.get(`/places/route?srcLat=${mapData.selectedSrc.lat}&srcLng=${mapData.selectedSrc.lng}&destLat=${mapData.selectedDestination.lat}&destLng=${mapData.selectedDestination.lng}`);
      const routes = res.data.data.details as RoutesApiResponse

      const normalizedRoutes: LeafletRoute[] = routes.map(({ summary, geometry }) => {
        return { summary, geometry: formatLngLatGeometry(geometry) }
      })

      return normalizedRoutes;
    },
    enabled: false,
    staleTime: 1000 * 60 * 15,
    retry: false
  });

  useEffect(() => {
    if (routeData) {
      setFetchedRoutes(routeData);
      setSelectedRoute(routeData[0]);
    }
  }, [routeData])

  return (
    <div className="flex bg-surface-container-lowest rounded-[1.5rem] shadow-ambient border border-border/40 overflow-visible w-full max-w-[480px]">
      <div className="flex-1 py-4 px-6 flex flex-col gap-2 relative">
        <PlaceSearchInput
          placeholder='From: Current Location'
          value={mapData.selectedSrc?.address || ""}
          icon={<Circle size={16} strokeWidth={3} className="text-[#006d42]" />}
          updateRouteData={(pos) => {
            setSelectedSrc(pos);
          }}
        />

        <div className="absolute left-[31px] top-[48px] bottom-[48px] w-[2px] bg-border/40" />

        <PlaceSearchInput
          placeholder='To: Search destination'
          value={mapData.selectedDestination?.address || ""}
          icon={<MapPin size={20} strokeWidth={2.5} className="text-[#7d5700]" />}
          updateRouteData={(pos) => {
            setSelectedDestination(pos);
          }}
        />

        {mapData.selectedSrc && mapData.selectedDestination && (
          <div className="flex justify-end pt-1 animate-in fade-in slide-in-from-top-2 duration-300">
            <button
              onClick={() => {
                getRoute()
              }}
              disabled={isFetchingRoute}
              className="px-6 h-10 rounded-xl bg-primary text-primary-foreground shadow-lg flex items-center justify-center gap-2 hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all group font-bold text-label-md disabled:opacity-70"
            >
              {isFetchingRoute ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Finding route...</span>
                </>
              ) : (
                <>
                  <span>Get Route</span>
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;

