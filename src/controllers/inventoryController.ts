import { Request, Response, NextFunction } from 'express';
import { updateStock, getInventoryLog } from '../services/inventoryService';
import { AuthRequest } from '../middleware/auth';

export async function update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { quantity, reason } = req.body as { quantity: number; reason: string };
    const changedBy = req.admin?.email ?? 'admin';

    await updateStock(String(req.params.id), quantity, reason, changedBy);

    res.json({ success: true, message: 'Inventory updated successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getLog(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const productId = req.params.id
      ? String(req.params.id)
      : req.query.product_id
        ? String(req.query.product_id)
        : null;

    if (!productId) {
      res.status(400).json({ success: false, error: 'Product ID is required' });
      return;
    }

    const log = await getInventoryLog(productId);
    res.json({ success: true, data: log });
  } catch (err) {
    next(err);
  }
}
