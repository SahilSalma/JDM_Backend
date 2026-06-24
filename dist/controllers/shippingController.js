"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listZones = listZones;
exports.createZone = createZone;
exports.updateZone = updateZone;
exports.removeZone = removeZone;
exports.getRate = getRate;
exports.getAllRates = getAllRates;
const shippingService_1 = require("../services/shippingService");
const VALID_TYPES = ['forklift', 'no_forklift', 'liftgate', 'residential_delivery'];
async function listZones(req, res, next) {
    try {
        const zones = await (0, shippingService_1.getShippingZones)();
        res.json({ success: true, data: zones });
    }
    catch (err) {
        next(err);
    }
}
async function createZone(req, res, next) {
    try {
        const { state_code, city, zone_type, rate_cents, is_active } = req.body;
        const zone = await (0, shippingService_1.createShippingZone)({
            state_code: state_code || null,
            city: city || null,
            zone_type,
            rate_cents,
            is_active: is_active ?? true,
        });
        res.status(201).json({ success: true, data: zone });
    }
    catch (err) {
        next(err);
    }
}
async function updateZone(req, res, next) {
    try {
        const id = String(req.params.id);
        const zone = await (0, shippingService_1.updateShippingZone)(id, req.body);
        res.json({ success: true, data: zone });
    }
    catch (err) {
        next(err);
    }
}
async function removeZone(req, res, next) {
    try {
        const id = String(req.params.id);
        await (0, shippingService_1.deleteShippingZone)(id);
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
}
async function getRate(req, res, next) {
    try {
        const type = String(req.query.type || 'no_forklift');
        const state = req.query.state ? String(req.query.state) : undefined;
        const city = req.query.city ? String(req.query.city) : undefined;
        if (!VALID_TYPES.includes(type)) {
            res.status(400).json({ success: false, error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` });
            return;
        }
        const rate_cents = await (0, shippingService_1.getShippingRate)(type, state, city);
        res.json({ success: true, data: { rate_cents, type } });
    }
    catch (err) {
        next(err);
    }
}
async function getAllRates(req, res, next) {
    try {
        const state = req.query.state ? String(req.query.state) : undefined;
        const city = req.query.city ? String(req.query.city) : undefined;
        const [forklift, no_forklift, liftgate, residential_delivery] = await Promise.all([
            (0, shippingService_1.getShippingRate)('forklift', state, city),
            (0, shippingService_1.getShippingRate)('no_forklift', state, city),
            (0, shippingService_1.getShippingRate)('liftgate', state, city),
            (0, shippingService_1.getShippingRate)('residential_delivery', state, city),
        ]);
        res.json({
            success: true,
            data: {
                forklift,
                no_forklift,
                liftgate,
                residential_delivery,
            },
        });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=shippingController.js.map