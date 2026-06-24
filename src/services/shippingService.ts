import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../config/database';
import { shippingZones } from '../models/schema';
import type { NewShippingZone } from '../models/schema';
import { createError } from '../middleware/errorHandler';

export type ShippingType = 'forklift' | 'no_forklift' | 'liftgate' | 'residential_delivery';

const DEFAULT_RATES: Record<ShippingType, number> = {
  forklift: 50000,
  no_forklift: 70000,
  liftgate: 85000,
  residential_delivery: 75000,
};

export async function getShippingRate(
  type: ShippingType,
  stateCode?: string,
  city?: string,
): Promise<number> {
  let zone = null;

  // Try city + state match
  if (stateCode && city) {
    const cleanCity = city.trim().toLowerCase();
    const stateZones = await db
      .select()
      .from(shippingZones)
      .where(
        and(
          eq(shippingZones.zone_type, type),
          eq(shippingZones.is_active, true),
          eq(shippingZones.state_code, stateCode),
        ),
      )
      .all();
    zone = stateZones.find(z => z.city && z.city.trim().toLowerCase() === cleanCity) || null;
  }

  // Try state match
  if (!zone && stateCode) {
    zone = await db
      .select()
      .from(shippingZones)
      .where(
        and(
          eq(shippingZones.zone_type, type),
          eq(shippingZones.is_active, true),
          eq(shippingZones.state_code, stateCode),
          isNull(shippingZones.city),
        ),
      )
      .get();
  }

  // Fall back to default zone (no state/city)
  if (!zone) {
    zone = await db
      .select()
      .from(shippingZones)
      .where(
        and(
          eq(shippingZones.zone_type, type),
          eq(shippingZones.is_active, true),
          isNull(shippingZones.state_code),
          isNull(shippingZones.city),
        ),
      )
      .get();
  }

  if (!zone) {
    return DEFAULT_RATES[type] ?? 70000;
  }

  return zone.rate_cents;
}

export async function getShippingZones() {
  return db
    .select()
    .from(shippingZones)
    .orderBy(shippingZones.zone_type, shippingZones.state_code);
}

export async function createShippingZone(data: Omit<NewShippingZone, 'id'>) {
  const id = crypto.randomUUID();
  await db.insert(shippingZones).values({ id, ...data });
  return db.select().from(shippingZones).where(eq(shippingZones.id, id)).get();
}

export async function updateShippingZone(
  id: string,
  data: Partial<NewShippingZone>,
) {
  const existing = await db
    .select()
    .from(shippingZones)
    .where(eq(shippingZones.id, id))
    .get();

  if (!existing) throw createError('Shipping zone not found', 404);

  await db.update(shippingZones).set(data).where(eq(shippingZones.id, id));
  return db.select().from(shippingZones).where(eq(shippingZones.id, id)).get();
}

export async function deleteShippingZone(id: string) {
  const existing = await db
    .select()
    .from(shippingZones)
    .where(eq(shippingZones.id, id))
    .get();

  if (!existing) throw createError('Shipping zone not found', 404);

  await db.delete(shippingZones).where(eq(shippingZones.id, id));
}
