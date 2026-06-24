"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.logout = logout;
exports.changePassword = changePassword;
exports.getStats = getStats;
exports.getSettings = getSettings;
exports.updateSettings = updateSettings;
exports.bulkUpdateSettings = bulkUpdateSettings;
exports.getPublicSettings = getPublicSettings;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../models/schema");
const env_1 = require("../config/env");
const orderService_1 = require("../services/orderService");
const logger_1 = require("../middleware/logger");
const settingsService_1 = require("../services/settingsService");
async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        const admin = await database_1.db
            .select()
            .from(schema_1.adminUsers)
            .where((0, drizzle_orm_1.eq)(schema_1.adminUsers.email, email))
            .get();
        if (!admin) {
            res.status(401).json({ success: false, error: 'Invalid credentials' });
            return;
        }
        const isValid = await bcryptjs_1.default.compare(password, admin.password_hash);
        if (!isValid) {
            res.status(401).json({ success: false, error: 'Invalid credentials' });
            return;
        }
        // Update last login
        await database_1.db
            .update(schema_1.adminUsers)
            .set({ last_login_at: new Date().toISOString() })
            .where((0, drizzle_orm_1.eq)(schema_1.adminUsers.id, admin.id));
        const token = jsonwebtoken_1.default.sign({ sub: admin.id, email: admin.email, role: admin.role }, env_1.env.JWT_SECRET, { expiresIn: '8h' });
        const refreshToken = jsonwebtoken_1.default.sign({ sub: admin.id }, env_1.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
        // Set httpOnly cookie
        res.cookie('admin_token', token, {
            httpOnly: true,
            secure: env_1.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 8 * 60 * 60 * 1000, // 8 hours
        });
        res.cookie('admin_refresh_token', refreshToken, {
            httpOnly: true,
            secure: env_1.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        logger_1.logger.info({ adminId: admin.id, email: admin.email }, 'Admin login successful');
        res.json({
            success: true,
            data: {
                admin: {
                    id: admin.id,
                    email: admin.email,
                    name: admin.name,
                    role: admin.role,
                },
                token,
            },
        });
    }
    catch (err) {
        next(err);
    }
}
function logout(req, res) {
    res.clearCookie('admin_token');
    res.clearCookie('admin_refresh_token');
    res.json({ success: true, message: 'Logged out successfully' });
}
async function changePassword(req, res, next) {
    try {
        const authReq = req;
        const { current_password, new_password } = req.body;
        const admin = await database_1.db
            .select()
            .from(schema_1.adminUsers)
            .where((0, drizzle_orm_1.eq)(schema_1.adminUsers.id, authReq.admin.id))
            .get();
        if (!admin) {
            res.status(404).json({ success: false, error: 'Admin user not found' });
            return;
        }
        const isValid = await bcryptjs_1.default.compare(current_password, admin.password_hash);
        if (!isValid) {
            res.status(400).json({ success: false, error: 'Current password is incorrect' });
            return;
        }
        const newHash = await bcryptjs_1.default.hash(new_password, 12);
        await database_1.db
            .update(schema_1.adminUsers)
            .set({ password_hash: newHash })
            .where((0, drizzle_orm_1.eq)(schema_1.adminUsers.id, admin.id));
        logger_1.logger.info({ adminId: admin.id }, 'Admin password changed');
        res.json({ success: true, message: 'Password changed successfully' });
    }
    catch (err) {
        next(err);
    }
}
async function getStats(req, res, next) {
    try {
        const stats = await (0, orderService_1.getOrderStats)();
        res.json({ success: true, data: stats });
    }
    catch (err) {
        next(err);
    }
}
async function getSettings(req, res, next) {
    try {
        const conditions = await database_1.db.select().from(schema_1.saleConditions);
        res.json({ success: true, data: conditions });
    }
    catch (err) {
        next(err);
    }
}
async function updateSettings(req, res, next) {
    try {
        const { rule_key, rule_value, description, is_active } = req.body;
        const existing = await database_1.db
            .select()
            .from(schema_1.saleConditions)
            .where((0, drizzle_orm_1.eq)(schema_1.saleConditions.rule_key, rule_key))
            .get();
        if (!existing) {
            res.status(404).json({ success: false, error: 'Setting not found' });
            return;
        }
        const updateData = {
            rule_value,
            updated_at: new Date().toISOString(),
        };
        if (description !== undefined)
            updateData.description = description;
        if (is_active !== undefined)
            updateData.is_active = is_active;
        await database_1.db.update(schema_1.saleConditions).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.saleConditions.rule_key, rule_key));
        (0, settingsService_1.clearSettingsCache)();
        const updated = await database_1.db
            .select()
            .from(schema_1.saleConditions)
            .where((0, drizzle_orm_1.eq)(schema_1.saleConditions.rule_key, rule_key))
            .get();
        res.json({ success: true, data: updated });
    }
    catch (err) {
        next(err);
    }
}
async function bulkUpdateSettings(req, res, next) {
    try {
        const { settings } = req.body;
        if (!Array.isArray(settings) || settings.length === 0) {
            res.status(400).json({ success: false, error: 'settings array is required' });
            return;
        }
        const now = new Date().toISOString();
        for (const { key, value } of settings) {
            const safeValue = value !== undefined && value !== null ? String(value) : '';
            const existing = await database_1.db
                .select()
                .from(schema_1.saleConditions)
                .where((0, drizzle_orm_1.eq)(schema_1.saleConditions.rule_key, key))
                .get();
            if (existing) {
                await database_1.db.update(schema_1.saleConditions).set({ rule_value: safeValue, updated_at: now }).where((0, drizzle_orm_1.eq)(schema_1.saleConditions.rule_key, key));
            }
            else {
                await database_1.db.insert(schema_1.saleConditions).values({
                    id: crypto_1.default.randomUUID(),
                    rule_key: key,
                    rule_value: safeValue,
                    is_active: true,
                    updated_at: now,
                });
            }
        }
        (0, settingsService_1.clearSettingsCache)();
        res.json({ success: true, message: 'Settings updated' });
    }
    catch (err) {
        next(err);
    }
}
/** Public endpoint — returns all non-sensitive settings as key-value map */
async function getPublicSettings(req, res, next) {
    try {
        const SENSITIVE_PREFIXES = ['stripe_'];
        const [rows, navRows, allMakes, allModels] = await Promise.all([
            database_1.db.select().from(schema_1.saleConditions),
            database_1.db.select().from(schema_1.navbarSettings),
            database_1.db.select().from(schema_1.makes).orderBy(schema_1.makes.sort_order),
            database_1.db.select().from(schema_1.models),
        ]);
        const map = {};
        for (const row of rows) {
            if (SENSITIVE_PREFIXES.some((p) => row.rule_key.startsWith(p)))
                continue;
            if (!row.is_active)
                continue;
            map[row.rule_key] = row.rule_value;
        }
        for (const row of navRows) {
            if (!row.is_active)
                continue;
            map[`navbar_${row.setting_key}`] = row.setting_value;
        }
        // Derive vehicle_data from makes/models tables (overrides stale sale_conditions value)
        const modelsByMakeId = {};
        for (const m of allModels) {
            if (!modelsByMakeId[m.make_id])
                modelsByMakeId[m.make_id] = [];
            modelsByMakeId[m.make_id].push(m.name);
        }
        const vehicleData = allMakes.map((mk) => ({
            name: mk.name,
            models: modelsByMakeId[mk.id] ?? [],
            yearRange: { min: mk.year_range_min ?? 1980, max: mk.year_range_max ?? 2025 },
        }));
        map['vehicle_data'] = JSON.stringify(vehicleData);
        // Do not cache settings in browser/CDN so updates reflect instantly
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.json({ success: true, data: map });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=adminController.js.map