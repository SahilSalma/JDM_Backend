"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStock = updateStock;
exports.getInventoryLog = getInventoryLog;
exports.checkStock = checkStock;
exports.decrementStock = decrementStock;
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../models/schema");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../middleware/logger");
async function updateStock(productId, newQuantity, reason, changedBy = 'admin') {
    const product = await database_1.db
        .select({ id: schema_1.products.id, quantity: schema_1.products.quantity })
        .from(schema_1.products)
        .where((0, drizzle_orm_1.eq)(schema_1.products.id, productId))
        .get();
    if (!product)
        throw (0, errorHandler_1.createError)('Product not found', 404);
    const previousQuantity = product.quantity;
    await database_1.db
        .update(schema_1.products)
        .set({ quantity: newQuantity, updated_at: new Date().toISOString() })
        .where((0, drizzle_orm_1.eq)(schema_1.products.id, productId));
    await database_1.db.insert(schema_1.inventoryLog).values({
        id: crypto.randomUUID(),
        product_id: productId,
        previous_quantity: previousQuantity,
        new_quantity: newQuantity,
        change_reason: reason,
        changed_by: changedBy,
        created_at: new Date().toISOString(),
    });
    logger_1.logger.info({ productId, previousQuantity, newQuantity, reason, changedBy }, 'Inventory updated');
}
async function getInventoryLog(productId) {
    return database_1.db
        .select()
        .from(schema_1.inventoryLog)
        .where((0, drizzle_orm_1.eq)(schema_1.inventoryLog.product_id, productId))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.inventoryLog.created_at));
}
async function checkStock(productId, quantity) {
    const product = await database_1.db
        .select({ quantity: schema_1.products.quantity })
        .from(schema_1.products)
        .where((0, drizzle_orm_1.eq)(schema_1.products.id, productId))
        .get();
    if (!product)
        return false;
    return product.quantity >= quantity;
}
async function decrementStock(productId, quantity) {
    const product = await database_1.db
        .select({ id: schema_1.products.id, quantity: schema_1.products.quantity, title: schema_1.products.title })
        .from(schema_1.products)
        .where((0, drizzle_orm_1.eq)(schema_1.products.id, productId))
        .get();
    if (!product) {
        logger_1.logger.warn({ productId }, 'Product not found when decrementing stock');
        return;
    }
    const newQuantity = Math.max(0, product.quantity - quantity);
    await database_1.db
        .update(schema_1.products)
        .set({ quantity: newQuantity, updated_at: new Date().toISOString() })
        .where((0, drizzle_orm_1.eq)(schema_1.products.id, productId));
    await database_1.db.insert(schema_1.inventoryLog).values({
        id: crypto.randomUUID(),
        product_id: productId,
        previous_quantity: product.quantity,
        new_quantity: newQuantity,
        change_reason: `Order fulfillment: -${quantity} units`,
        changed_by: 'system',
        created_at: new Date().toISOString(),
    });
    logger_1.logger.info({ productId, previous: product.quantity, new: newQuantity, quantity }, 'Stock decremented for order');
}
//# sourceMappingURL=inventoryService.js.map