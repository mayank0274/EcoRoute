import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useMapContext } from '@/context/mapContext';
import { getAqiLevel, formatDuration, formatDistanceM, getEstimatedArrival } from '@/utils/routeDetails';
import { cn } from '@/lib/utils';


const RELIABILITY_STYLES = {
  high: {
    className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    label: 'HIGH',
  },
  medium: {
    className: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    label: 'MEDIUM',
  },
  low: {
    className: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    label: 'LOW',
  },
  invalid: {
    className: 'bg-muted/40 text-muted-foreground border-border/40',
    label: 'INVALID',
  },
} as const;

const AqiGauge: React.FC<{ aqi: number }> = ({ aqi }) => {
  const level = getAqiLevel(aqi)!;
  const strokeDasharray = 251.2;
  const percentage = Math.min(aqi / 300, 1);
  const strokeDashoffset = strokeDasharray * (1 - percentage);

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="56"
            cy="56"
            r="44"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
            className="text-surface-container"
          />
          <circle
            cx="56"
            cy="56"
            r="44"
            fill="transparent"
            stroke={level.color}
            strokeWidth="8"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-foreground leading-none">{Math.round(aqi)}</span>
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Avg. AQI*</span>
        </div>
      </div>
      <div
        className={cn("mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm", `bg-${level.color}20`, `text-${level.color}`, `border-${level.color}40`)}
      >
        {level.label}
      </div>
    </div>
  );
};

interface RouteTabProps {
  label: string;
  duration: string;
  isSelected: boolean;
  onClick: () => void;
  isPollutionOptimized?: boolean;
}

const RouteTab: React.FC<RouteTabProps> = ({ label, duration, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex-1 flex flex-col items-start gap-0.5 p-3 rounded-2xl transition-all duration-300
        ${isSelected
          ? 'bg-primary text-primary-foreground shadow-lg'
          : 'bg-surface-container text-secondary hover:bg-surface-container-high'
        }
      `}
    >
      <span className={`text-[9px] font-bold uppercase tracking-wider ${isSelected ? 'opacity-90' : 'opacity-60'}`}>
        {label}
      </span>
      <span className="text-sm font-black whitespace-nowrap">
        {duration}
      </span>
    </button>
  );
};


const RouteSheet: React.FC = () => {
  const { mapData, setSelectedRoute } = useMapContext();
  const { fetchedRoutes, selectedRoute } = mapData;
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (fetchedRoutes.length > 0) {
      setIsOpen(true);
    }
  }, [fetchedRoutes.length]);

  const labels = React.useMemo(() => {
    if (!fetchedRoutes.length) return [];

    const labs = new Array(fetchedRoutes.length).fill('');

    let minAqiIdx = 0;
    let minTimeIdx = 0;

    for (let i = 1; i < fetchedRoutes.length; i++) {
      if (fetchedRoutes[i].summary.avgAqi < fetchedRoutes[minAqiIdx].summary.avgAqi) {
        minAqiIdx = i;
      }
      if (fetchedRoutes[i].summary.travelTimeInSeconds < fetchedRoutes[minTimeIdx].summary.travelTimeInSeconds) {
        minTimeIdx = i;
      }
    }

    if (minAqiIdx === minTimeIdx) {
      labs[minAqiIdx] = 'FAST & CLEAN';
      let altCount = 1;
      for (let i = 0; i < fetchedRoutes.length; i++) {
        if (i !== minAqiIdx) {
          labs[i] = fetchedRoutes.length <= 2 ? 'ALTERNATIVE' : `ALT ${altCount++}`;
        }
      }
    } else {
      labs[minAqiIdx] = 'LEAST POLLUTED';
      labs[minTimeIdx] = 'FASTEST';
      for (let i = 0; i < fetchedRoutes.length; i++) {
        if (!labs[i]) labs[i] = 'BALANCED';
      }
    }
    return labs;
  }, [fetchedRoutes]);

  if (!fetchedRoutes.length) return null;

  // Use the first one as selected if none is selected
  const activeRoute = selectedRoute || fetchedRoutes[0];
  const { summary } = activeRoute;
  const aqiReliability = summary.aqiReliability ?? 'invalid';
  const coveredRatioPercent =
    typeof summary.aqiCoveredRatio === 'number'
      ? Math.round(summary.aqiCoveredRatio * 100)
      : null;
  const reliabilityStyle =
    RELIABILITY_STYLES[aqiReliability] ?? RELIABILITY_STYLES.invalid;




  const content = (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2 p-1">
        {fetchedRoutes.slice(0, 3).map((route, i) => (
          <RouteTab
            key={i}
            label={labels[i] || `ROUTE ${i + 1}`}
            duration={formatDuration(route.summary.departureTime, route.summary.arrivalTime)}
            isSelected={activeRoute === route}
            onClick={() => setSelectedRoute(route)}
          />
        ))}
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">
              Estimated Arrival
            </span>
            <span className="text-3xl font-black text-foreground lowercase">
              {getEstimatedArrival(summary.travelTimeInSeconds)}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">
              Distance
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-foreground">
                {formatDistanceM(summary.lengthInMeters)}
              </span>
              <span className="text-sm font-bold text-muted-foreground uppercase">km</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <AqiGauge aqi={summary.avgAqi} />

          <div className="flex flex-col items-center gap-1">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
              Reliability score
            </div>
            <div
              className={cn(
                'px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest',
                reliabilityStyle.className,
              )}
              title={
                coveredRatioPercent !== null
                  ? `Coverage: ${coveredRatioPercent}%`
                  : 'Coverage unavailable'
              }
            >
              {reliabilityStyle.label}
              {coveredRatioPercent !== null ? ` · ${coveredRatioPercent}%` : ''}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3 px-3 py-3 bg-surface-container/50 rounded-2xl border border-border/20">
        <p className="text-label-sm text-xs font-semibold text-secondary leading-snug">
          <ul className='list-disc'>
            <li>*Represent avg. exposure throughout the route.</li>
            <li>Low reliability means the result is based on limited AQI data or sparse station coverage.</li>
            <li>AQI calcutaions of routes &gt;250km are currently skipped.</li>
          </ul>
        </p>
      </div>
    </div>
  );

  return (
    <> 
      {/* mobile  */}
      <div
        className={`
          md:hidden fixed left-0 right-0 z-[2000] bottom-[68px]
          transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
          ${isOpen ? 'translate-y-0' : 'translate-y-[calc(100%-60px)]'}
        `}
      >
        <div className="bg-surface-container-lowest rounded-t-[2.5rem] border-t border-border/30 shadow-[0_-8px_32px_rgba(0,0,0,0.1)]">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex flex-col items-center pt-4 pb-2 focus:outline-none"
          >
            <div className="w-12 h-1.5 bg-surface-container-high rounded-full mb-1" />
            <div className={`p-1 transition-transform duration-300 ${isOpen ? 'rotate-0' : 'rotate-180'}`}>
              <ChevronDown size={20} className="text-muted-foreground/60" />
            </div>
          </button>

          <div className="px-6 pb-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {content}
          </div>
        </div>
      </div>

      {/* desktop  */}
      <div className="hidden md:block pointer-events-auto w-[96%] mt-3">
        <div className="bg-surface-container-lowest border border-border/40 rounded-[2rem] shadow-ambient overflow-hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-6 py-2 flex items-center justify-between hover:bg-surface-container-lowest/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-label-md font-extrabold text-foreground tracking-tight">Route Details</span>
            </div>
            <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
              <ChevronDown size={18} className="text-muted-foreground" />
            </div>
          </button>

          <div
            className={cn(`
              px-6 transition-all duration-500 ease-in-out`,
              isOpen ? 'max-h-[800px] opacity-100 pb-6' : 'max-h-0 opacity-0'
            )}
          >
            {content}
          </div>
        </div>
      </div>
    </>
  );
};

export default RouteSheet;
