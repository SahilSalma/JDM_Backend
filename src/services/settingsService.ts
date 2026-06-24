/**
 * Lightweight reader for `sale_conditions` (key/value site settings).
 * Cached in-memory for 60s to avoid hammering SQLite on every product list call.
 */
import { eq } from 'drizzle-orm';
import { db } from '../config/database';
import { saleConditions } from '../models/schema';

interface CacheEntry {
  value: string;
  ts: number;
}
const TTL_MS = 60 * 1000;
const cache = new Map<string, CacheEntry>();

export async function getSettingValue(key: string, fallback = ''): Promise<string> {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < TTL_MS) {
    return cached.value || fallback;
  }
  const row = await db
    .select({ value: saleConditions.rule_value, active: saleConditions.is_active })
    .from(saleConditions)
    .where(eq(saleConditions.rule_key, key))
    .get();
  const value = row && row.active ? row.value : '';
  cache.set(key, { value, ts: Date.now() });
  return value || fallback;
}

export function clearSettingsCache(): void {
  cache.clear();
}
