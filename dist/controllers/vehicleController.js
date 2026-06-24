"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMakes = listMakes;
exports.createMake = createMake;
exports.updateMake = updateMake;
exports.deleteMake = deleteMake;
exports.listModels = listModels;
exports.createModel = createModel;
exports.updateModel = updateModel;
exports.deleteModel = deleteModel;
const crypto_1 = __importDefault(require("crypto"));
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../models/schema");
function slug(str) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
function getParam(val) {
    if (Array.isArray(val))
        return val[0];
    return val;
}
// ─── Makes ────────────────────────────────────────────────────────────────────
async function listMakes(req, res, next) {
    try {
        const rows = await database_1.db.select().from(schema_1.makes).orderBy(schema_1.makes.sort_order);
        res.json({ success: true, data: rows });
    }
    catch (err) {
        next(err);
    }
}
async function createMake(req, res, next) {
    try {
        const { name, year_range_min, year_range_max } = req.body;
        const trimmed = name?.trim();
        if (!trimmed) {
            res.status(400).json({ success: false, error: 'Name is required' });
            return;
        }
        const existing = await database_1.db.select({ id: schema_1.makes.id }).from(schema_1.makes).where((0, drizzle_orm_1.eq)(schema_1.makes.name, trimmed)).get();
        if (existing) {
            res.status(409).json({ success: false, error: 'Make already exists' });
            return;
        }
        const maxSort = await database_1.db.select({ sort: schema_1.makes.sort_order }).from(schema_1.makes).orderBy(schema_1.makes.sort_order).get();
        const sortOrder = maxSort ? maxSort.sort + 1 : 0;
        const id = crypto_1.default.randomUUID();
        const now = new Date().toISOString();
        await database_1.db.insert(schema_1.makes).values({
            id,
            name: trimmed,
            slug: slug(trimmed),
            year_range_min: year_range_min ?? 1980,
            year_range_max: year_range_max ?? 2025,
            sort_order: sortOrder,
            created_at: now,
            updated_at: now,
        });
        const row = await database_1.db.select().from(schema_1.makes).where((0, drizzle_orm_1.eq)(schema_1.makes.id, id)).get();
        res.status(201).json({ success: true, data: row });
    }
    catch (err) {
        next(err);
    }
}
async function updateMake(req, res, next) {
    try {
        const id = String(req.params.id);
        const { name, year_range_min, year_range_max, sort_order } = req.body;
        const existing = await database_1.db.select().from(schema_1.makes).where((0, drizzle_orm_1.eq)(schema_1.makes.id, id)).get();
        if (!existing) {
            res.status(404).json({ success: false, error: 'Make not found' });
            return;
        }
        const patch = { updated_at: new Date().toISOString() };
        if (name !== undefined) {
            const trimmed = name.trim();
            if (!trimmed) {
                res.status(400).json({ success: false, error: 'Name cannot be empty' });
                return;
            }
            patch.name = trimmed;
            patch.slug = slug(trimmed);
        }
        if (year_range_min !== undefined)
            patch.year_range_min = year_range_min;
        if (year_range_max !== undefined)
            patch.year_range_max = year_range_max;
        if (sort_order !== undefined)
            patch.sort_order = sort_order;
        await database_1.db.update(schema_1.makes).set(patch).where((0, drizzle_orm_1.eq)(schema_1.makes.id, id));
        const row = await database_1.db.select().from(schema_1.makes).where((0, drizzle_orm_1.eq)(schema_1.makes.id, id)).get();
        res.json({ success: true, data: row });
    }
    catch (err) {
        next(err);
    }
}
async function deleteMake(req, res, next) {
    try {
        const id = String(req.params.id);
        const existing = await database_1.db.select().from(schema_1.makes).where((0, drizzle_orm_1.eq)(schema_1.makes.id, id)).get();
        if (!existing) {
            res.status(404).json({ success: false, error: 'Make not found' });
            return;
        }
        const productRef = await database_1.db.select({ id: schema_1.products.id }).from(schema_1.products).where((0, drizzle_orm_1.eq)(schema_1.products.make_id, id)).limit(1).get();
        if (productRef) {
            res.status(409).json({ success: false, error: `Cannot delete "${existing.name}": one or more products reference this make` });
            return;
        }
        await database_1.db.delete(schema_1.models).where((0, drizzle_orm_1.eq)(schema_1.models.make_id, id));
        await database_1.db.delete(schema_1.makes).where((0, drizzle_orm_1.eq)(schema_1.makes.id, id));
        res.json({ success: true, message: `Make "${existing.name}" deleted` });
    }
    catch (err) {
        next(err);
    }
}
// ─── Models ────────────────────────────────────────────────────────────────────
async function listModels(req, res, next) {
    try {
        const makeId = getParam(req.query.make_id);
        const rows = makeId
            ? await database_1.db.select().from(schema_1.models).where((0, drizzle_orm_1.eq)(schema_1.models.make_id, makeId)).orderBy(schema_1.models.name)
            : await database_1.db.select().from(schema_1.models).orderBy(schema_1.models.name);
        res.json({ success: true, data: rows });
    }
    catch (err) {
        next(err);
    }
}
async function createModel(req, res, next) {
    try {
        const { name, make_id } = req.body;
        const trimmed = name?.trim();
        if (!trimmed) {
            res.status(400).json({ success: false, error: 'Name is required' });
            return;
        }
        if (!make_id) {
            res.status(400).json({ success: false, error: 'make_id is required' });
            return;
        }
        const makeExists = await database_1.db.select({ id: schema_1.makes.id }).from(schema_1.makes).where((0, drizzle_orm_1.eq)(schema_1.makes.id, make_id)).get();
        if (!makeExists) {
            res.status(404).json({ success: false, error: 'Make not found' });
            return;
        }
        const existing = await database_1.db.select({ id: schema_1.models.id }).from(schema_1.models).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.models.name, trimmed), (0, drizzle_orm_1.eq)(schema_1.models.make_id, make_id))).get();
        if (existing) {
            res.status(409).json({ success: false, error: 'Model already exists for this make' });
            return;
        }
        const id = crypto_1.default.randomUUID();
        const now = new Date().toISOString();
        await database_1.db.insert(schema_1.models).values({
            id,
            name: trimmed,
            slug: slug(trimmed),
            make_id,
            created_at: now,
            updated_at: now,
        });
        const row = await database_1.db.select().from(schema_1.models).where((0, drizzle_orm_1.eq)(schema_1.models.id, id)).get();
        res.status(201).json({ success: true, data: row });
    }
    catch (err) {
        next(err);
    }
}
async function updateModel(req, res, next) {
    try {
        const id = String(req.params.id);
        const { name } = req.body;
        const existing = await database_1.db.select().from(schema_1.models).where((0, drizzle_orm_1.eq)(schema_1.models.id, id)).get();
        if (!existing) {
            res.status(404).json({ success: false, error: 'Model not found' });
            return;
        }
        const patch = { updated_at: new Date().toISOString() };
        if (name !== undefined) {
            const trimmed = name.trim();
            if (!trimmed) {
                res.status(400).json({ success: false, error: 'Name cannot be empty' });
                return;
            }
            patch.name = trimmed;
            patch.slug = slug(trimmed);
        }
        await database_1.db.update(schema_1.models).set(patch).where((0, drizzle_orm_1.eq)(schema_1.models.id, id));
        const row = await database_1.db.select().from(schema_1.models).where((0, drizzle_orm_1.eq)(schema_1.models.id, id)).get();
        res.json({ success: true, data: row });
    }
    catch (err) {
        next(err);
    }
}
async function deleteModel(req, res, next) {
    try {
        const id = String(req.params.id);
        const existing = await database_1.db.select().from(schema_1.models).where((0, drizzle_orm_1.eq)(schema_1.models.id, id)).get();
        if (!existing) {
            res.status(404).json({ success: false, error: 'Model not found' });
            return;
        }
        const productRef = await database_1.db.select({ id: schema_1.products.id }).from(schema_1.products).where((0, drizzle_orm_1.eq)(schema_1.products.model_id, id)).limit(1).get();
        if (productRef) {
            res.status(409).json({ success: false, error: 'Cannot delete: one or more products reference this model' });
            return;
        }
        await database_1.db.delete(schema_1.models).where((0, drizzle_orm_1.eq)(schema_1.models.id, id));
        res.json({ success: true, message: `Model "${existing.name}" deleted` });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=vehicleController.js.map