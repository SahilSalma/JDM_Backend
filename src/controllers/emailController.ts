import { Request, Response, NextFunction } from 'express';
import { eq, desc, asc, like, or, sql } from 'drizzle-orm';
import { db } from '../config/database';
import { emailLog } from '../models/schema';
import { sendCustomEmail, getEmailTemplates, resendEmail, getEmailLogById } from '../services/emailService';

export async function send(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { to, subject, body, template_enabled, order_id, attachments } = req.body as {
      to: string;
      subject: string;
      body: string;
      template_enabled?: boolean;
      order_id?: string;
      attachments?: Array<{ filename: string; path: string }>;
    };

    await sendCustomEmail(to, subject, body, template_enabled ?? false, attachments, order_id);

    res.json({ success: true, message: 'Email sent successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getTemplates(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const templates = getEmailTemplates();
    res.json({ success: true, data: templates });
  } catch (err) {
    next(err);
  }
}

export async function getLog(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.min(100, parseInt((req.query.limit as string) || '50', 10));
    const offset = (page - 1) * limit;

    const search = (req.query.search as string)?.trim() || '';
    const statusFilter = (req.query.status as string)?.trim() || '';

    const sortBy = req.query.sortBy === 'recipient_email' ? 'recipient_email'
      : req.query.sortBy === 'status' ? 'status'
      : 'sent_at';
    const sortDir = (req.query.sortOrder as string) === 'asc' ? 'ASC' : 'DESC';

    // Build WHERE clause with drizzle-safe parameterization
    const conditions: ReturnType<typeof sql>[] = [];

    if (statusFilter) {
      const statuses = statusFilter.split(',').map(s => s.trim()).filter(Boolean);
      const statusConditions = statuses.map(s => sql`${emailLog.status} = ${s}`);
      conditions.push(sql`(${sql.join(statusConditions, sql` OR `)})`);
    }

    if (search) {
      const term = `%${search}%`;
      conditions.push(sql`(${like(emailLog.recipient_email, term)} OR ${like(emailLog.subject, term)})`);
    }

    const whereClause = conditions.length > 0
      ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
      : sql``;

    const countRows = await db.all(sql`
      SELECT COUNT(*) as total FROM email_log ${whereClause}
    `);
    const total = (countRows[0] as { total: number })?.total ?? 0;
    const totalPages = Math.ceil(total / limit);

    const logs = await db.all(sql`
      SELECT * FROM email_log ${whereClause}
      ORDER BY ${sql.raw(sortBy)} ${sql.raw(sortDir)}
      LIMIT ${limit} OFFSET ${offset}
    `);

    res.json({
      success: true,
      data: logs,
      meta: { total, page, limit, total_pages: totalPages },
    });
  } catch (err) {
    next(err);
  }
}

export async function getLogEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;
    const log = await getEmailLogById(id);
    if (!log) {
      res.status(404).json({ success: false, message: 'Email log entry not found' });
      return;
    }
    res.json({ success: true, data: log });
  } catch (err) {
    next(err);
  }
}

export async function retryEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await resendEmail(req.params.id as string);
    res.json({ success: true, message: 'Email resent successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getLogByRecipient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const recipient = decodeURIComponent(String(req.params.email));
    const logs = await db
      .select()
      .from(emailLog)
      .where(eq(emailLog.recipient_email, recipient))
      .orderBy(desc(emailLog.sent_at))
      .limit(50);

    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
}
