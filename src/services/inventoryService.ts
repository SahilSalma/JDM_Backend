import { eq, desc } from 'drizzle-orm';
import { db } from '../config/database';
import { products, inventoryLog } from '../models/schema';
import { createError } from '../middleware/errorHandler';
import { logger } from '../middleware/logger';

export async function updateStock(
  productId: string,
  newQuantity: number,
  reason: string,
  changedBy = 'admin',
): Promise<void> {
  const product = await db
    .select({ id: products.id, quantity: products.quantity })
    .from(products)
    .where(eq(products.id, productId))
    .get();

  if (!product) throw createError('Product not found', 404);

  const previousQuantity = product.quantity;

  await db
    .update(products)
    .set({ quantity: newQuantity, updated_at: new Date().toISOString() })
    .where(eq(products.id, productId));

  await db.insert(inventoryLog).values({
    id: crypto.randomUUID(),
    product_id: productId,
    previous_quantity: previousQuantity,
    new_quantity: newQuantity,
    change_reason: reason,
    changed_by: changedBy,
    created_at: new Date().toISOString(),
  });

  logger.info(
    { productId, previousQuantity, newQuantity, reason, changedBy },
    'Inventory updated',
  );
}

export async function getInventoryLog(productId: string) {
  return db
    .select()
    .from(inventoryLog)
    .where(eq(inventoryLog.product_id, productId))
    .orderBy(desc(inventoryLog.created_at));
}

export async function checkStock(productId: string, quantity: number): Promise<boolean> {
  const product = await db
    .select({ quantity: products.quantity })
    .from(products)
    .where(eq(products.id, productId))
    .get();

  if (!product) return false;
  return product.quantity >= quantity;
}

export async function decrementStock(productId: string, quantity: number): Promise<void> {
  const product = await db
    .select({ id: products.id, quantity: products.quantity, title: products.title })
    .from(products)
    .where(eq(products.id, productId))
    .get();

  if (!product) {
    logger.warn({ productId }, 'Product not found when decrementing stock');
    return;
  }

  const newQuantity = Math.max(0, product.quantity - quantity);

  await db
    .update(products)
    .set({ quantity: newQuantity, updated_at: new Date().toISOString() })
    .where(eq(products.id, productId));

  await db.insert(inventoryLog).values({
    id: crypto.randomUUID(),
    product_id: productId,
    previous_quantity: product.quantity,
    new_quantity: newQuantity,
    change_reason: `Order fulfillment: -${quantity} units`,
    changed_by: 'system',
    created_at: new Date().toISOString(),
  });

  logger.info(
    { productId, previous: product.quantity, new: newQuantity, quantity },
    'Stock decremented for order',
  );
}
