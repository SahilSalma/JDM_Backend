"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getShippingRate = getShippingRate;
exports.getShippingZones = getShippingZones;
exports.createShippingZone = createShippingZone;
exports.updateShippingZone = updateShippingZone;
exports.deleteShippingZone = deleteShippingZone;
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../models/schema");
const errorHandler_1 = require("../middleware/errorHandler");
const DEFAULT_RATES = {
    forklift: 50000,
    no_forklift: 70000,
    liftgate: 85000,
    residential_delivery: 75000,
};
async function getShippingRate(type, stateCode, city) {
    let zone = null;
    // Try city + state match
    if (stateCode && city) {
        const cleanCity = city.trim().toLowerCase();
        const stateZones = await database_1.db
            .select()
            .from(schema_1.shippingZones)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.shippingZones.zone_type, type), (0, drizzle_orm_1.eq)(schema_1.shippingZones.is_active, true), (0, drizzle_orm_1.eq)(schema_1.shippingZones.state_code, stateCode)))
            .all();
        zone = stateZones.find(z => z.city && z.city.trim().toLowerCase() === cleanCity) || null;
    }
    // Try state match
    if (!zone && stateCode) {
        zone = await database_1.db
            .select()
            .from(schema_1.shippingZones)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.shippingZones.zone_type, type), (0, drizzle_orm_1.eq)(schema_1.shippingZones.is_active, true), (0, drizzle_orm_1.eq)(schema_1.shippingZones.state_code, stateCode), (0, drizzle_orm_1.isNull)(schema_1.shippingZones.city)))
            .get();
    }
    // Fall back to default zone (no state/city)
    if (!zone) {
        zone = await database_1.db
            .select()
            .from(schema_1.shippingZones)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.shippingZones.zone_type, type), (0, drizzle_orm_1.eq)(schema_1.shippingZones.is_active, true), (0, drizzle_orm_1.isNull)(schema_1.shippingZones.state_code), (0, drizzle_orm_1.isNull)(schema_1.shippingZones.city)))
            .get();
    }
    if (!zone) {
        return DEFAULT_RATES[type] ?? 70000;
    }
    return zone.rate_cents;
}
async function getShippingZones() {
    return database_1.db
        .select()
        .from(schema_1.shippingZones)
        .orderBy(schema_1.shippingZones.zone_type, schema_1.shippingZones.state_code);
}
async function createShippingZone(data) {
    const id = crypto.randomUUID();
    await database_1.db.insert(schema_1.shippingZones).values({ id, ...data });
    return database_1.db.select().from(schema_1.shippingZones).where((0, drizzle_orm_1.eq)(schema_1.shippingZones.id, id)).get();
}
async function updateShippingZone(id, data) {
    const existing = await database_1.db
        .select()
        .from(schema_1.shippingZones)
        .where((0, drizzle_orm_1.eq)(schema_1.shippingZones.id, id))
        .get();
    if (!existing)
        throw (0, errorHandler_1.createError)('Shipping zone not found', 404);
    await database_1.db.update(schema_1.shippingZones).set(data).where((0, drizzle_orm_1.eq)(schema_1.shippingZones.id, id));
    return database_1.db.select().from(schema_1.shippingZones).where((0, drizzle_orm_1.eq)(schema_1.shippingZones.id, id)).get();
}
async function deleteShippingZone(id) {
    const existing = await database_1.db
        .select()
        .from(schema_1.shippingZones)
        .where((0, drizzle_orm_1.eq)(schema_1.shippingZones.id, id))
        .get();
    if (!existing)
        throw (0, errorHandler_1.createError)('Shipping zone not found', 404);
    await database_1.db.delete(schema_1.shippingZones).where((0, drizzle_orm_1.eq)(schema_1.shippingZones.id, id));
}
//# sourceMappingURL=shippingService.js.map