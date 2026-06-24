import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '../config/database';
import { emailTemplates, orderNotificationRecipients, subscriptions, navbarSettings } from '../models/schema';
import { clearSettingsCache } from '../services/settingsService';

// Email Templates
export async function getEmailTemplatesController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const templates = await db.select().from(emailTemplates).orderBy(emailTemplates.template_name);
    res.json({ success: true, data: templates });
  } catch (err) {
    next(err);
  }
}

export async function getEmailTemplateById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const template = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, String(req.params.id)))
      .get();
    
    if (!template) {
      res.status(404).json({ success: false, error: 'Template not found' });
      return;
    }
    
    res.json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
}

export async function createEmailTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { template_name, subject_template, html_template, description, is_active } = req.body as {
      template_name: string;
      subject_template?: string;
      html_template: string;
      description?: string;
      is_active?: boolean;
    };

    const template = await db.insert(emailTemplates).values({
      id: crypto.randomUUID(),
      template_name,
      subject_template: subject_template || '',
      html_template,
      description: description || '',
      is_active: is_active ?? true,
    }).returning().get();

    clearSettingsCache();
    res.json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
}

export async function updateEmailTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const existing = await db
      .select({ id: emailTemplates.id })
      .from(emailTemplates)
      .where(eq(emailTemplates.id, String(req.params.id)))
      .get();

    if (!existing) {
      res.status(404).json({ success: false, error: 'Template not found' });
      return;
    }

    const { subject_template, html_template, description, is_active } = req.body as {
      subject_template?: string;
      html_template?: string;
      description?: string;
      is_active?: boolean;
    };

    const updateData: Partial<typeof emailTemplates.$inferInsert> = {
      updated_at: new Date().toISOString(),
    };

    if (subject_template !== undefined) updateData.subject_template = subject_template;
    if (html_template !== undefined) updateData.html_template = html_template;
    if (description !== undefined) updateData.description = description;
    if (is_active !== undefined) updateData.is_active = is_active;

    await db.update(emailTemplates).set(updateData).where(eq(emailTemplates.id, String(req.params.id)));

    clearSettingsCache();

    const updated = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, String(req.params.id)))
      .get();

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteEmailTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const existing = await db
      .select({ id: emailTemplates.id })
      .from(emailTemplates)
      .where(eq(emailTemplates.id, String(req.params.id)))
      .get();

    if (!existing) {
      res.status(404).json({ success: false, error: 'Template not found' });
      return;
    }

    await db.delete(emailTemplates).where(eq(emailTemplates.id, String(req.params.id)));
    clearSettingsCache();

    res.json({ success: true, message: 'Template deleted' });
  } catch (err) {
    next(err);
  }
}

// Order Notification Recipients
export async function getOrderNotificationRecipients(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const recipients = await db
      .select()
      .from(orderNotificationRecipients)
      .orderBy(orderNotificationRecipients.sort_order)
      .where(eq(orderNotificationRecipients.is_active, true));
    
    res.json({ success: true, data: recipients });
  } catch (err) {
    next(err);
  }
}

export async function createOrderNotificationRecipient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, name, is_active, sort_order } = req.body as {
      email: string;
      name?: string;
      is_active?: boolean;
      sort_order?: number;
    };

    const recipient = await db.insert(orderNotificationRecipients).values({
      id: crypto.randomUUID(),
      email,
      name: name || '',
      is_active: is_active ?? true,
      sort_order: sort_order ?? 0,
    }).returning().get();

    res.json({ success: true, data: recipient });
  } catch (err) {
    next(err);
  }
}

export async function updateOrderNotificationRecipient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const existing = await db
      .select({ id: orderNotificationRecipients.id })
      .from(orderNotificationRecipients)
      .where(eq(orderNotificationRecipients.id, String(req.params.id)))
      .get();

    if (!existing) {
      res.status(404).json({ success: false, error: 'Recipient not found' });
      return;
    }

    const { email, name, is_active, sort_order } = req.body as {
      email?: string;
      name?: string;
      is_active?: boolean;
      sort_order?: number;
    };

    const updateData: Partial<typeof orderNotificationRecipients.$inferInsert> = {};

    if (email !== undefined) updateData.email = email;
    if (name !== undefined) updateData.name = name;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (sort_order !== undefined) updateData.sort_order = sort_order;

    await db.update(orderNotificationRecipients).set(updateData).where(eq(orderNotificationRecipients.id, String(req.params.id)));

    const updated = await db
      .select()
      .from(orderNotificationRecipients)
      .where(eq(orderNotificationRecipients.id, String(req.params.id)))
      .get();

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteOrderNotificationRecipient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const existing = await db
      .select({ id: orderNotificationRecipients.id })
      .from(orderNotificationRecipients)
      .where(eq(orderNotificationRecipients.id, String(req.params.id)))
      .get();

    if (!existing) {
      res.status(404).json({ success: false, error: 'Recipient not found' });
      return;
    }

    await db.delete(orderNotificationRecipients).where(eq(orderNotificationRecipients.id, String(req.params.id)));

    res.json({ success: true, message: 'Recipient deleted' });
  } catch (err) {
    next(err);
  }
}

// Subscriptions
export async function getSubscriptions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.min(100, parseInt((req.query.limit as string) || '50', 10));
    const offset = (page - 1) * limit;

    const [rows, countRows] = await Promise.all([
      db
        .select()
        .from(subscriptions)
        .orderBy(subscriptions.subscribed_at)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(subscriptions),
    ]);

    res.json({ 
      success: true, 
      data: rows,
      meta: {
        total: countRows[0]?.count ?? 0,
        page,
        limit,
        total_pages: Math.ceil((countRows[0]?.count ?? 0) / limit),
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const existing = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(eq(subscriptions.id, String(req.params.id)))
      .get();

    if (!existing) {
      res.status(404).json({ success: false, error: 'Subscription not found' });
      return;
    }

    await db.delete(subscriptions).where(eq(subscriptions.id, String(req.params.id)));

    res.json({ success: true, message: 'Subscription removed' });
  } catch (err) {
    next(err);
  }
}

// Navbar Settings
export async function getNavbarSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = await db.select().from(navbarSettings);
    const map: Record<string, string> = {};
    for (const row of settings) {
      map[row.setting_key] = row.setting_value;
    }
    res.json({ success: true, data: map });
  } catch (err) {
    next(err);
  }
}

export async function updateNavbarSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { settings } = req.body as { settings: Array<{ key: string; value: string }> };

    if (!Array.isArray(settings) || settings.length === 0) {
      res.status(400).json({ success: false, error: 'settings array is required' });
      return;
    }

    const now = new Date().toISOString();

    for (const { key, value } of settings) {
      const existing = await db
        .select()
        .from(navbarSettings)
        .where(eq(navbarSettings.setting_key, key))
        .get();

      if (existing) {
        await db.update(navbarSettings).set({ setting_value: value, updated_at: now }).where(eq(navbarSettings.setting_key, key));
      } else {
        await db.insert(navbarSettings).values({
          id: crypto.randomUUID(),
          setting_key: key,
          setting_value: value,
          is_active: true,
          updated_at: now,
        });
      }
    }

    clearSettingsCache();

    res.json({ success: true, message: 'Navbar settings updated' });
  } catch (err) {
    next(err);
  }
}