"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSettingValue = getSettingValue;
exports.clearSettingsCache = clearSettingsCache;
/**
 * Lightweight reader for `sale_conditions` (key/value site settings).
 * Cached in-memory for 60s to avoid hammering SQLite on every product list call.
 */
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../models/schema");
const TTL_MS = 60 * 1000;
const cache = new Map();
async function getSettingValue(key, fallback = '') {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.ts < TTL_MS) {
        return cached.value || fallback;
    }
    const row = await database_1.db
        .select({ value: schema_1.saleConditions.rule_value, active: schema_1.saleConditions.is_active })
        .from(schema_1.saleConditions)
        .where((0, drizzle_orm_1.eq)(schema_1.saleConditions.rule_key, key))
        .get();
    const value = row && row.active ? row.value : '';
    cache.set(key, { value, ts: Date.now() });
    return value || fallback;
}
function clearSettingsCache() {
    cache.clear();
}
//# sourceMappingURL=settingsService.js.map