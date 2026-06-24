"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.update = update;
exports.getLog = getLog;
const inventoryService_1 = require("../services/inventoryService");
async function update(req, res, next) {
    try {
        const { quantity, reason } = req.body;
        const changedBy = req.admin?.email ?? 'admin';
        await (0, inventoryService_1.updateStock)(String(req.params.id), quantity, reason, changedBy);
        res.json({ success: true, message: 'Inventory updated successfully' });
    }
    catch (err) {
        next(err);
    }
}
async function getLog(req, res, next) {
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
        const log = await (0, inventoryService_1.getInventoryLog)(productId);
        res.json({ success: true, data: log });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=inventoryController.js.map