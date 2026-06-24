import type { NewShippingZone } from '../models/schema';
export type ShippingType = 'forklift' | 'no_forklift' | 'liftgate' | 'residential_delivery';
export declare function getShippingRate(type: ShippingType, stateCode?: string, city?: string): Promise<number>;
export declare function getShippingZones(): Promise<{
    id: string;
    is_active: boolean;
    state_code: string | null;
    city: string | null;
    zone_type: "forklift" | "no_forklift" | "liftgate" | "residential_delivery";
    rate_cents: number;
}[]>;
export declare function createShippingZone(data: Omit<NewShippingZone, 'id'>): Promise<{
    id: string;
    is_active: boolean;
    state_code: string | null;
    city: string | null;
    zone_type: "forklift" | "no_forklift" | "liftgate" | "residential_delivery";
    rate_cents: number;
} | undefined>;
export declare function updateShippingZone(id: string, data: Partial<NewShippingZone>): Promise<{
    id: string;
    is_active: boolean;
    state_code: string | null;
    city: string | null;
    zone_type: "forklift" | "no_forklift" | "liftgate" | "residential_delivery";
    rate_cents: number;
} | undefined>;
export declare function deleteShippingZone(id: string): Promise<void>;
//# sourceMappingURL=shippingService.d.ts.map