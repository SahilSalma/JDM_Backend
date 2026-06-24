"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const database_1 = require("../config/database");
const schema_1 = require("../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
async function requireAuth(req, res, next) {
    try {
        let token;
        // Try cookie first, then Authorization header
        if (req.cookies?.admin_token) {
            token = req.cookies.admin_token;
        }
        else if (req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.slice(7);
        }
        if (!token) {
            res.status(401).json({ success: false, error: 'Authentication required' });
            return;
        }
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        }
        catch {
            res.status(401).json({ success: false, error: 'Invalid or expired token' });
            return;
        }
        const admin = await database_1.db
            .select({
            id: schema_1.adminUsers.id,
            email: schema_1.adminUsers.email,
            name: schema_1.adminUsers.name,
            role: schema_1.adminUsers.role,
        })
            .from(schema_1.adminUsers)
            .where((0, drizzle_orm_1.eq)(schema_1.adminUsers.id, payload.sub))
            .get();
        if (!admin) {
            res.status(401).json({ success: false, error: 'Admin user not found' });
            return;
        }
        req.admin = admin;
        next();
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=auth.js.map