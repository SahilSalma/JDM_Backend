import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '../config/database';
import { makes, models, products } from '../models/schema';

function slug(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function getParam(val: string | string[] | undefined): string | undefined {
  if (Array.isArray(val)) return val[0];
  return val;
}

// ─── Makes ────────────────────────────────────────────────────────────────────

export async function listMakes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rows = await db.select().from(makes).orderBy(makes.sort_order);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

export async function createMake(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, year_range_min, year_range_max } = req.body as {
      name: string;
      year_range_min?: number;
      year_range_max?: number;
    };

    const trimmed = name?.trim();
    if (!trimmed) {
      res.status(400).json({ success: false, error: 'Name is required' });
      return;
    }

    const existing = await db.select({ id: makes.id }).from(makes).where(eq(makes.name, trimmed)).get();
    if (existing) {
      res.status(409).json({ success: false, error: 'Make already exists' });
      return;
    }

    const maxSort = await db.select({ sort: makes.sort_order }).from(makes).orderBy(makes.sort_order).get();
    const sortOrder = maxSort ? maxSort.sort + 1 : 0;

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(makes).values({
      id,
      name: trimmed,
      slug: slug(trimmed),
      year_range_min: year_range_min ?? 1980,
      year_range_max: year_range_max ?? 2025,
      sort_order: sortOrder,
      created_at: now,
      updated_at: now,
    });

    const row = await db.select().from(makes).where(eq(makes.id, id)).get();
    res.status(201).json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

export async function updateMake(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id);
    const { name, year_range_min, year_range_max, sort_order } = req.body as {
      name?: string;
      year_range_min?: number;
      year_range_max?: number;
      sort_order?: number;
    };

    const existing = await db.select().from(makes).where(eq(makes.id, id)).get();
    if (!existing) {
      res.status(404).json({ success: false, error: 'Make not found' });
      return;
    }

    const patch: Record<string, any> = { updated_at: new Date().toISOString() };
    if (name !== undefined) {
      const trimmed = name.trim();
      if (!trimmed) {
        res.status(400).json({ success: false, error: 'Name cannot be empty' });
        return;
      }
      patch.name = trimmed;
      patch.slug = slug(trimmed);
    }
    if (year_range_min !== undefined) patch.year_range_min = year_range_min;
    if (year_range_max !== undefined) patch.year_range_max = year_range_max;
    if (sort_order !== undefined) patch.sort_order = sort_order;

    await db.update(makes).set(patch).where(eq(makes.id, id));

    const row = await db.select().from(makes).where(eq(makes.id, id)).get();
    res.json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

export async function deleteMake(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id);

    const existing = await db.select().from(makes).where(eq(makes.id, id)).get();
    if (!existing) {
      res.status(404).json({ success: false, error: 'Make not found' });
      return;
    }

    const productRef = await db.select({ id: products.id }).from(products).where(eq(products.make_id, id)).limit(1).get();
    if (productRef) {
      res.status(409).json({ success: false, error: `Cannot delete "${existing.name}": one or more products reference this make` });
      return;
    }

    await db.delete(models).where(eq(models.make_id, id));
    await db.delete(makes).where(eq(makes.id, id));

    res.json({ success: true, message: `Make "${existing.name}" deleted` });
  } catch (err) {
    next(err);
  }
}

// ─── Models ────────────────────────────────────────────────────────────────────

export async function listModels(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const makeId = getParam(req.query.make_id as string | string[] | undefined);
    const rows = makeId
      ? await db.select().from(models).where(eq(models.make_id, makeId)).orderBy(models.name)
      : await db.select().from(models).orderBy(models.name);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

export async function createModel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, make_id } = req.body as { name: string; make_id: string };

    const trimmed = name?.trim();
    if (!trimmed) {
      res.status(400).json({ success: false, error: 'Name is required' });
      return;
    }
    if (!make_id) {
      res.status(400).json({ success: false, error: 'make_id is required' });
      return;
    }

    const makeExists = await db.select({ id: makes.id }).from(makes).where(eq(makes.id, make_id)).get();
    if (!makeExists) {
      res.status(404).json({ success: false, error: 'Make not found' });
      return;
    }

    const existing = await db.select({ id: models.id }).from(models).where(and(eq(models.name, trimmed), eq(models.make_id, make_id))).get();
    if (existing) {
      res.status(409).json({ success: false, error: 'Model already exists for this make' });
      return;
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(models).values({
      id,
      name: trimmed,
      slug: slug(trimmed),
      make_id,
      created_at: now,
      updated_at: now,
    });

    const row = await db.select().from(models).where(eq(models.id, id)).get();
    res.status(201).json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

export async function updateModel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id);
    const { name } = req.body as { name?: string };

    const existing = await db.select().from(models).where(eq(models.id, id)).get();
    if (!existing) {
      res.status(404).json({ success: false, error: 'Model not found' });
      return;
    }

    const patch: Record<string, any> = { updated_at: new Date().toISOString() };
    if (name !== undefined) {
      const trimmed = name.trim();
      if (!trimmed) {
        res.status(400).json({ success: false, error: 'Name cannot be empty' });
        return;
      }
      patch.name = trimmed;
      patch.slug = slug(trimmed);
    }

    await db.update(models).set(patch).where(eq(models.id, id));

    const row = await db.select().from(models).where(eq(models.id, id)).get();
    res.json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

export async function deleteModel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id);

    const existing = await db.select().from(models).where(eq(models.id, id)).get();
    if (!existing) {
      res.status(404).json({ success: false, error: 'Model not found' });
      return;
    }

    const productRef = await db.select({ id: products.id }).from(products).where(eq(products.model_id, id)).limit(1).get();
    if (productRef) {
      res.status(409).json({ success: false, error: 'Cannot delete: one or more products reference this model' });
      return;
    }

    await db.delete(models).where(eq(models.id, id));

    res.json({ success: true, message: `Model "${existing.name}" deleted` });
  } catch (err) {
    next(err);
  }
}
