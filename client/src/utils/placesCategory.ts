import {
    Plane,
    Utensils,
    Hotel,
    HeartPulse,
    GraduationCap,
    ShoppingBag,
    Film,
    Trees,
    Briefcase,
    MapPin,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";


export const AppCategory = Object.freeze({
    TRANSPORT: "transport",
    FOOD: "food",
    STAY: "stay",
    HEALTH: "health",
    EDUCATION: "education",
    SHOPPING: "shopping",
    ENTERTAINMENT: "entertainment",
    NATURE: "nature",
    WORK: "work",
    OTHER: "other",
} as const);

export type AppCategory =
    (typeof AppCategory)[keyof typeof AppCategory];


export function mapTomTomCategory(raw?: string): AppCategory {
    if (!raw) return AppCategory.OTHER;

    const cat = raw.toLowerCase();

    if (
        cat.includes("airport") ||
        cat.includes("station") ||
        cat.includes("metro") ||
        cat.includes("bus") ||
        cat.includes("transport")
    )
        return AppCategory.TRANSPORT;

    if (
        cat.includes("restaurant") ||
        cat.includes("food") ||
        cat.includes("cafe") ||
        cat.includes("coffee")
    )
        return AppCategory.FOOD;

    if (cat.includes("hotel") || cat.includes("guest") || cat.includes("motel"))
        return AppCategory.STAY;

    if (
        cat.includes("hospital") ||
        cat.includes("pharmacy") ||
        cat.includes("clinic")
    )
        return AppCategory.HEALTH;

    if (
        cat.includes("school") ||
        cat.includes("university") ||
        cat.includes("college")
    )
        return AppCategory.EDUCATION;

    if (
        cat.includes("mall") ||
        cat.includes("shop") ||
        cat.includes("store") ||
        cat.includes("market")
    )
        return AppCategory.SHOPPING;

    if (
        cat.includes("cinema") ||
        cat.includes("movie") ||
        cat.includes("museum") ||
        cat.includes("gym") ||
        cat.includes("stadium")
    )
        return AppCategory.ENTERTAINMENT;

    if (
        cat.includes("park") ||
        cat.includes("forest") ||
        cat.includes("garden") ||
        cat.includes("nature")
    )
        return AppCategory.NATURE;

    if (
        cat.includes("office") ||
        cat.includes("company") ||
        cat.includes("industrial") ||
        cat.includes("factory")
    )
        return AppCategory.WORK;

    return AppCategory.OTHER;
}

export const categoryIconMap: Record<AppCategory, LucideIcon> = {
    transport: Plane,
    food: Utensils,
    stay: Hotel,
    health: HeartPulse,
    education: GraduationCap,
    shopping: ShoppingBag,
    entertainment: Film,
    nature: Trees,
    work: Briefcase,
    other: MapPin,
};


export const categoryColorMap: Record<AppCategory, string> = {
    transport: "#ef4444",      // red (pollution)
    food: "#f59e0b",           // amber
    stay: "#3b82f6",           // blue
    health: "#10b981",         // green
    education: "#6366f1",      // indigo
    shopping: "#ec4899",       // pink
    entertainment: "#8b5cf6",  // purple
    nature: "#22c55e",         // strong green (clean areas)
    work: "#6b7280",           // gray
    other: "#9ca3af",          // light gray
};
