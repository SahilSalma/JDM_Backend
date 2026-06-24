import { Router, Request, Response, NextFunction } from 'express';
import * as orderService from '../services/orderService';

const router = Router();

router.get('/track', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { order_number, email, phone, page, limit } = req.query;

    if (!order_number && !email && !phone) {
      res.status(400).json({
        success: false,
        error: 'Please provide order_number, email, or phone to search',
      });
      return;
    }

    const query: { order_number?: string; email?: string; phone?: string } = {};
    if (order_number) query.order_number = String(order_number);
    else if (email) query.email = String(email);
    else if (phone) query.phone = String(phone);

    const pageNum = Math.max(1, parseInt(String(page || '1'), 10));
    const limitNum = Math.min(20, Math.max(1, parseInt(String(limit || '10'), 10)));

    const result = await orderService.lookupOrders(query, pageNum, limitNum);

    // Strip sensitive fields from response
    const safeOrders = result.orders.map((order) => ({
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      payment_status: order.payment_status,
      customer_first_name: order.customer_first_name,
      customer_last_name: order.customer_last_name,
      shipping_city: order.shipping_city,
      shipping_state: order.shipping_state,
      shipping_type: order.shipping_type,
      subtotal_cents: order.subtotal_cents,
      shipping_cents: order.shipping_cents,
      tax_cents: order.tax_cents,
      total_cents: order.total_cents,
      tracking_number: order.tracking_number,
      carrier: order.carrier,
      shipped_at: order.shipped_at,
      delivered_at: order.delivered_at,
      created_at: order.created_at,
      items: order.items.map((item: any) => ({
        product_title: item.product_title,
        product_sku: item.product_sku,
        quantity: item.quantity,
        unit_price_cents: item.unit_price_cents,
        total_cents: item.total_cents,
      })),
    }));

    res.json({
      success: true,
      data: safeOrders,
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
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await orderService.getOrderById(String(req.params.id));
    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    // Strip sensitive fields for the public confirmation page
    const safeOrder = {
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      customer_email: order.customer_email,
      customer_name: order.customer_name,
      total_cents: order.total_cents,
      shipping_cents: order.shipping_cents,
      items: (order.items ?? []).map((item: any) => ({
        product_id: item.product_id,
        title: item.product_title,
        sku: item.product_sku,
        price_cents: item.unit_price_cents,
        quantity: item.quantity,
      })),
    };

    res.json(safeOrder);
  } catch (err) {
    next(err);
  }
});

export default router;
