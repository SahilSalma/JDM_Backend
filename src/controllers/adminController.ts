import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '../config/database';
import { adminUsers, saleConditions, navbarSettings, makes, models } from '../models/schema';
import { env } from '../config/env';
import { getOrderStats } from '../services/orderService';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../middleware/logger';
import { clearSettingsCache } from '../services/settingsService';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const admin = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, email))
      .get();

    if (!admin) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    // Update last login
    await db
      .update(adminUsers)
      .set({ last_login_at: new Date().toISOString() })
      .where(eq(adminUsers.id, admin.id));

    const token = jwt.sign(
      { sub: admin.id, email: admin.email, role: admin.role },
      env.JWT_SECRET,
      { expiresIn: '8h' },
    );

    const refreshToken = jwt.sign(
      { sub: admin.id },
      env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' },
    );

    // Set httpOnly cookie
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    });

    res.cookie('admin_refresh_token', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    logger.info({ adminId: admin.id, email: admin.email }, 'Admin login successful');

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
  } catch (err) {
    next(err);
  }
}

export function logout(req: Request, res: Response): void {
  res.clearCookie('admin_token');
  res.clearCookie('admin_refresh_token');
  res.json({ success: true, message: 'Logged out successfully' });
}

export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthRequest;
    const { current_password, new_password } = req.body as { current_password: string; new_password: string };

    const admin = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.id, authReq.admin!.id))
      .get();

    if (!admin) {
      res.status(404).json({ success: false, error: 'Admin user not found' });
      return;
    }

    const isValid = await bcrypt.compare(current_password, admin.password_hash);
    if (!isValid) {
      res.status(400).json({ success: false, error: 'Current password is incorrect' });
      return;
    }

    const newHash = await bcrypt.hash(new_password, 12);
    await db
      .update(adminUsers)
      .set({ password_hash: newHash })
      .where(eq(adminUsers.id, admin.id));

    logger.info({ adminId: admin.id }, 'Admin password changed');
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stats = await getOrderStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
}

export async function getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const conditions = await db.select().from(saleConditions);
    res.json({ success: true, data: conditions });
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { rule_key, rule_value, description, is_active } = req.body as {
      rule_key: string;
      rule_value: string;
      description?: string;
      is_active?: boolean;
    };

    const existing = await db
      .select()
      .from(saleConditions)
      .where(eq(saleConditions.rule_key, rule_key))
      .get();

    if (!existing) {
      res.status(404).json({ success: false, error: 'Setting not found' });
      return;
    }

    const updateData: Partial<typeof saleConditions.$inferInsert> = {
      rule_value,
      updated_at: new Date().toISOString(),
    };
    if (description !== undefined) updateData.description = description;
    if (is_active !== undefined) updateData.is_active = is_active;

    await db.update(saleConditions).set(updateData).where(eq(saleConditions.rule_key, rule_key));

    clearSettingsCache();

    const updated = await db
      .select()
      .from(saleConditions)
      .where(eq(saleConditions.rule_key, rule_key))
      .get();

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function bulkUpdateSettings(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { settings } = req.body as { settings: Array<{ key: string; value: any }> };

    if (!Array.isArray(settings) || settings.length === 0) {
      res.status(400).json({ success: false, error: 'settings array is required' });
      return;
    }

    const now = new Date().toISOString();

    for (const { key, value } of settings) {
      const safeValue = value !== undefined && value !== null ? String(value) : '';
      const existing = await db
        .select()
        .from(saleConditions)
        .where(eq(saleConditions.rule_key, key))
        .get();

      if (existing) {
        await db.update(saleConditions).set({ rule_value: safeValue, updated_at: now }).where(eq(saleConditions.rule_key, key));
      } else {
        await db.insert(saleConditions).values({
          id: crypto.randomUUID(),
          rule_key: key,
          rule_value: safeValue,
          is_active: true,
          updated_at: now,
        });
      }
    }

    clearSettingsCache();

    res.json({ success: true, message: 'Settings updated' });
  } catch (err) {
    next(err);
  }
}

/** Public endpoint — returns all non-sensitive settings as key-value map */
export async function getPublicSettings(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const SENSITIVE_PREFIXES = ['stripe_'];
    const [rows, navRows, allMakes, allModels] = await Promise.all([
      db.select().from(saleConditions),
      db.select().from(navbarSettings),
      db.select().from(makes).orderBy(makes.sort_order),
      db.select().from(models),
    ]);
    const map: Record<string, string> = {};

    for (const row of rows) {
      if (SENSITIVE_PREFIXES.some((p) => row.rule_key.startsWith(p))) continue;
      if (!row.is_active) continue;
      map[row.rule_key] = row.rule_value;
    }

    for (const row of navRows) {
      if (!row.is_active) continue;
      map[`navbar_${row.setting_key}`] = row.setting_value;
    }

    // Derive vehicle_data from makes/models tables (overrides stale sale_conditions value)
    const modelsByMakeId: Record<string, string[]> = {};
    for (const m of allModels) {
      if (!modelsByMakeId[m.make_id]) modelsByMakeId[m.make_id] = [];
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
  } catch (err) {
    next(err);
  }
}
