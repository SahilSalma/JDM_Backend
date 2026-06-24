"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = list;
exports.getById = getById;
exports.updateStatus = updateStatus;
exports.updateTracking = updateTracking;
const orderService = __importStar(require("../services/orderService"));
const emailService_1 = require("../services/emailService");
const logger_1 = require("../middleware/logger");
async function list(req, res, next) {
    try {
        const { status, payment_status, paymentStatus, customer_email, search, from_date, to_date, page, limit, sortBy, sortOrder, } = req.query;
        const filters = {};
        if (status)
            filters.status = String(status);
        const finalPaymentStatus = payment_status || paymentStatus;
        if (finalPaymentStatus)
            filters.payment_status = String(finalPaymentStatus);
        if (customer_email)
            filters.customer_email = String(customer_email);
        if (search)
            filters.search = String(search);
        if (from_date)
            filters.from_date = String(from_date);
        if (to_date)
            filters.to_date = String(to_date);
        if (sortBy)
            filters.sortBy = String(sortBy);
        if (sortOrder)
            filters.sortOrder = sortOrder === 'asc' ? 'asc' : 'desc';
        const pageNum = Math.max(1, parseInt(String(page || '1'), 10));
        const limitNum = Math.min(100, Math.max(1, parseInt(String(limit || '20'), 10)));
        const result = await orderService.getOrders(filters, pageNum, limitNum);
        res.json({
            success: true,
            data: result.orders,
            meta: {
                total: result.total,
                page: result.page,
                limit: result.limit,
                total_pages: Math.ceil(result.total / result.limit),
            },
        });
    }
    catch (err) {
        next(err);
    }
}
async function getById(req, res, next) {
    try {
        const order = await orderService.getOrderById(String(req.params.id));
        if (!order) {
            res.status(404).json({ success: false, error: 'Order not found' });
            return;
        }
        res.json({ success: true, data: order });
    }
    catch (err) {
        next(err);
    }
}
async function updateStatus(req, res, next) {
    try {
        const { status, admin_notes } = req.body;
        const order = await orderService.updateOrderStatus(String(req.params.id), status, admin_notes);
        res.json({ success: true, data: order });
    }
    catch (err) {
        next(err);
    }
}
async function updateTracking(req, res, next) {
    try {
        const { tracking_number, carrier } = req.body;
        const order = await orderService.updateTracking(String(req.params.id), tracking_number, carrier);
        if (order) {
            // Send shipping confirmation email (non-blocking)
            (0, emailService_1.sendShippingConfirmation)(order).catch((err) => logger_1.logger.error({ err }, 'Failed to send shipping confirmation'));
        }
        res.json({ success: true, data: order });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=orderController.js.map