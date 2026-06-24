import { Request, Response, NextFunction } from 'express';
import * as orderService from '../services/orderService';
import { sendShippingConfirmation } from '../services/emailService';
import { logger } from '../middleware/logger';
import type { Order } from '../models/schema';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      status,
      payment_status,
      paymentStatus,
      customer_email,
      search,
      from_date,
      to_date,
      page,
      limit,
      sortBy,
      sortOrder,
    } = req.query;

    const filters: orderService.OrderFilters = {};
    if (status) filters.status = String(status);
    
    const finalPaymentStatus = payment_status || paymentStatus;
    if (finalPaymentStatus) filters.payment_status = String(finalPaymentStatus);
    
    if (customer_email) filters.customer_email = String(customer_email);
    if (search) filters.search = String(search);
    if (from_date) filters.from_date = String(from_date);
    if (to_date) filters.to_date = String(to_date);
    if (sortBy) filters.sortBy = String(sortBy);
    if (sortOrder) filters.sortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

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
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await orderService.getOrderById(String(req.params.id));
    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, admin_notes } = req.body as {
      status: Order['status'];
      admin_notes?: string;
    };

    const order = await orderService.updateOrderStatus(
      String(req.params.id),
      status,
      admin_notes,
    );

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

export async function updateTracking(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { tracking_number, carrier } = req.body as {
      tracking_number: string;
      carrier: string;
    };

    const order = await orderService.updateTracking(String(req.params.id), tracking_number, carrier);

    if (order) {
      // Send shipping confirmation email (non-blocking)
      sendShippingConfirmation(order).catch((err) =>
        logger.error({ err }, 'Failed to send shipping confirmation'),
      );
    }

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}
