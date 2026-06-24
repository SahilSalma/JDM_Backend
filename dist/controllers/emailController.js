"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.send = send;
exports.getTemplates = getTemplates;
exports.getLog = getLog;
exports.getLogEntry = getLogEntry;
exports.retryEmail = retryEmail;
exports.getLogByRecipient = getLogByRecipient;
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../models/schema");
const emailService_1 = require("../services/emailService");
async function send(req, res, next) {
    try {
        const { to, subject, body, template_enabled, order_id, attachments } = req.body;
        await (0, emailService_1.sendCustomEmail)(to, subject, body, template_enabled ?? false, attachments, order_id);
        res.json({ success: true, message: 'Email sent successfully' });
    }
    catch (err) {
        next(err);
    }
}
async function getTemplates(req, res, next) {
    try {
        const templates = (0, emailService_1.getEmailTemplates)();
        res.json({ success: true, data: templates });
    }
    catch (err) {
        next(err);
    }
}
async function getLog(req, res, next) {
    try {
        const page = Math.max(1, parseInt(req.query.page || '1', 10));
        const limit = Math.min(100, parseInt(req.query.limit || '50', 10));
        const offset = (page - 1) * limit;
        const search = req.query.search?.trim() || '';
        const statusFilter = req.query.status?.trim() || '';
        const sortBy = req.query.sortBy === 'recipient_email' ? 'recipient_email'
            : req.query.sortBy === 'status' ? 'status'
                : 'sent_at';
        const sortDir = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';
        // Build WHERE clause with drizzle-safe parameterization
        const conditions = [];
        if (statusFilter) {
            const statuses = statusFilter.split(',').map(s => s.trim()).filter(Boolean);
            const statusConditions = statuses.map(s => (0, drizzle_orm_1.sql) `${schema_1.emailLog.status} = ${s}`);
            conditions.push((0, drizzle_orm_1.sql) `(${drizzle_orm_1.sql.join(statusConditions, (0, drizzle_orm_1.sql) ` OR `)})`);
        }
        if (search) {
            const term = `%${search}%`;
            conditions.push((0, drizzle_orm_1.sql) `(${(0, drizzle_orm_1.like)(schema_1.emailLog.recipient_email, term)} OR ${(0, drizzle_orm_1.like)(schema_1.emailLog.subject, term)})`);
        }
        const whereClause = conditions.length > 0
            ? (0, drizzle_orm_1.sql) `WHERE ${drizzle_orm_1.sql.join(conditions, (0, drizzle_orm_1.sql) ` AND `)}`
            : (0, drizzle_orm_1.sql) ``;
        const countRows = await database_1.db.all((0, drizzle_orm_1.sql) `
      SELECT COUNT(*) as total FROM email_log ${whereClause}
    `);
        const total = countRows[0]?.total ?? 0;
        const totalPages = Math.ceil(total / limit);
        const logs = await database_1.db.all((0, drizzle_orm_1.sql) `
      SELECT * FROM email_log ${whereClause}
      ORDER BY ${drizzle_orm_1.sql.raw(sortBy)} ${drizzle_orm_1.sql.raw(sortDir)}
      LIMIT ${limit} OFFSET ${offset}
    `);
        res.json({
            success: true,
            data: logs,
            meta: { total, page, limit, total_pages: totalPages },
        });
    }
    catch (err) {
        next(err);
    }
}
async function getLogEntry(req, res, next) {
    try {
        const id = req.params.id;
        const log = await (0, emailService_1.getEmailLogById)(id);
        if (!log) {
            res.status(404).json({ success: false, message: 'Email log entry not found' });
            return;
        }
        res.json({ success: true, data: log });
    }
    catch (err) {
        next(err);
    }
}
async function retryEmail(req, res, next) {
    try {
        await (0, emailService_1.resendEmail)(req.params.id);
        res.json({ success: true, message: 'Email resent successfully' });
    }
    catch (err) {
        next(err);
    }
}
async function getLogByRecipient(req, res, next) {
    try {
        const recipient = decodeURIComponent(String(req.params.email));
        const logs = await database_1.db
            .select()
            .from(schema_1.emailLog)
            .where((0, drizzle_orm_1.eq)(schema_1.emailLog.recipient_email, recipient))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.emailLog.sent_at))
            .limit(50);
        res.json({ success: true, data: logs });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=emailController.js.map