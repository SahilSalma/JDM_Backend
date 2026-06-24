"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmOrder = confirmOrder;
const paymentService_1 = require("../services/paymentService");
const orderService_1 = require("../services/orderService");
const productService_1 = require("../services/productService");
const emailService_1 = require("../services/emailService");
const logger_1 = require("../middleware/logger");
async function confirmOrder(req, res, next) {
    try {
        const { opaque_data_descriptor, opaque_data_value, customer_email, customer_first_name, customer_last_name, customer_phone, shipping_line1, shipping_line2, shipping_city, shipping_state, shipping_zip, shipping_country, shipping_type, billing_line1, billing_line2, billing_city, billing_state, billing_zip, billing_country, items, customer_notes, theme, } = req.body;
        // Calculate totals on backend to verify and calculate shipping rate
        const totals = await (0, paymentService_1.calculateOrderTotal)(items, shipping_type, shipping_state, shipping_city);
        // Charge the credit card synchronously using Authorize.net REST API
        const chargeResult = await (0, paymentService_1.chargeCard)({
            amountCents: totals.amount,
            opaqueDataDescriptor: opaque_data_descriptor,
            opaqueDataValue: opaque_data_value,
            email: customer_email,
            billingAddress: {
                firstName: customer_first_name,
                lastName: customer_last_name,
                address: billing_line1 || shipping_line1,
                city: billing_city || shipping_city,
                state: billing_state || shipping_state,
                zip: billing_zip || shipping_zip,
                country: billing_country || shipping_country || 'US',
            },
            shippingAddress: {
                firstName: customer_first_name,
                lastName: customer_last_name,
                address: shipping_line1,
                city: shipping_city,
                state: shipping_state,
                zip: shipping_zip,
                country: shipping_country || 'US',
            },
        });
        // Build order items with product details
        const orderItems = await Promise.all(items.map(async (item) => {
            const product = await (0, productService_1.getProductById)(item.product_id);
            if (!product)
                throw new Error(`Product not found: ${item.product_id}`);
            return {
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price_cents: product.price_cents,
                product_title: product.title,
                product_sku: product.sku,
            };
        }));
        // Save order in database (which will decrement stock)
        const order = await (0, orderService_1.createOrder)({
            customer_email,
            customer_first_name,
            customer_last_name,
            customer_phone,
            shipping_line1,
            shipping_line2,
            shipping_city,
            shipping_state,
            shipping_zip,
            shipping_country: shipping_country ?? 'US',
            shipping_type,
            billing_line1,
            billing_line2,
            billing_city,
            billing_state,
            billing_zip,
            billing_country,
            subtotal_cents: totals.subtotal,
            shipping_cents: totals.shipping,
            total_cents: totals.amount,
            authorizenet_transaction_id: chargeResult.transactionId,
            customer_notes,
            items: orderItems,
        });
        if (order) {
            // Send confirmation emails (non-blocking)
            Promise.all([
                (0, emailService_1.sendOrderConfirmation)({ ...order, items: order.items, theme }),
                (0, emailService_1.sendOrderNotification)({ ...order, items: order.items }, theme),
            ]).catch((err) => logger_1.logger.error({ err }, 'Failed to send order emails'));
        }
        res.status(201).json({
            success: true,
            data: order,
        });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=checkoutController.js.map