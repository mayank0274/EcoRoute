import { intervalToDuration, parseISO } from "date-fns";

const AQI_SCALE = [
    { max: 50, label: 'Excellent', color: '#00B050', textDark: false },
    { max: 100, label: 'Good', color: '#92D050', textDark: true },
    { max: 150, label: 'Fair', color: '#FFFF00', textDark: true },
    { max: 200, label: 'Poor', color: '#FFC000', textDark: true },
    { max: 300, label: 'Very Poor', color: '#FF0000', textDark: false },
    { max: Infinity, label: 'Hazardous', color: '#7030A0', textDark: false },
] as const;

export function getAqiLevel(aqi: number) {
    return AQI_SCALE.find((el) => {
        return aqi <= el.max
    })
}

export function formatDuration(start: string, end: string): string {
    const d = intervalToDuration({ 
        start: parseISO(start), 
        end: parseISO(end) 
    });
    
    if (d.days) return `${d.days}d ${d.hours || 0}h`;
    if (d.hours) return `${d.hours}h ${d.minutes || 0}m`;
    return `${d.minutes || 0} min`;
}

export function formatDistanceM(meters: number): string {
    return (meters / 1000).toFixed(1);
}