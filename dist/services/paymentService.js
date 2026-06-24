"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateOrderTotal = calculateOrderTotal;
exports.chargeCard = chargeCard;
const env_1 = require("../config/env");
const database_1 = require("../config/database");
const schema_1 = require("../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const errorHandler_1 = require("../middleware/errorHandler");
const shippingService_1 = require("./shippingService");
const logger_1 = require("../middleware/logger");
const settingsService_1 = require("./settingsService");
/**
 * Calculates cart totals, validates stock, and calculates shipping.
 * Returns the computed total cents, subtotal cents, and shipping cents.
 */
async function calculateOrderTotal(items, shippingType, stateCode, city) {
    let subtotalCents = 0;
    for (const item of items) {
        const product = await database_1.db
            .select()
            .from(schema_1.products)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.products.id, item.product_id), (0, drizzle_orm_1.eq)(schema_1.products.is_deleted, false)))
            .get();
        if (!product) {
            throw (0, errorHandler_1.createError)(`Product not found: ${item.product_id}`, 400);
        }
        if (product.status !== 'active') {
            throw (0, errorHandler_1.createError)(`Product is not available: ${product.title}`, 400);
        }
        if (product.quantity < item.quantity) {
            throw (0, errorHandler_1.createError)(`Insufficient stock for: ${product.title}`, 400);
        }
        if (item.quantity > product.max_per_order) {
            throw (0, errorHandler_1.createError)(`Maximum ${product.max_per_order} unit(s) allowed per order for: ${product.title}`, 400);
        }
        subtotalCents += product.price_cents * item.quantity;
    }
    let shippingCents = await (0, shippingService_1.getShippingRate)(shippingType, stateCode, city);
    // Apply settings-based free shipping if subtotal qualifies
    const freeShippingThresholdStr = await (0, settingsService_1.getSettingValue)('free_shipping_threshold_cents', '0');
    const freeShippingThresholdCents = parseInt(freeShippingThresholdStr, 10) || 0;
    if (freeShippingThresholdCents > 0 && subtotalCents >= freeShippingThresholdCents) {
        shippingCents = 0;
    }
    // Apply settings-based order percentage discount if subtotal qualifies
    const discountThresholdStr = await (0, settingsService_1.getSettingValue)('discount_threshold_cents', '0');
    const discountThresholdCents = parseInt(discountThresholdStr, 10) || 0;
    let discountCents = 0;
    if (discountThresholdCents > 0 && subtotalCents >= discountThresholdCents) {
        const discountPercentageStr = await (0, settingsService_1.getSettingValue)('discount_percentage', '0');
        const discountPercentage = parseInt(discountPercentageStr, 10) || 0;
        if (discountPercentage > 0) {
            discountCents = Math.round((subtotalCents * discountPercentage) / 100);
        }
    }
    const totalCents = subtotalCents + shippingCents - discountCents;
    return {
        amount: totalCents,
        shipping: shippingCents,
        subtotal: subtotalCents,
        discount: discountCents,
    };
}
/**
 * Executes a credit card charge synchronously via Authorize.net's API using Accept.js opaque token data.
 */
async function chargeCard(params) {
    if (!env_1.env.AUTHORIZE_NET_API_LOGIN_ID || !env_1.env.AUTHORIZE_NET_TRANSACTION_KEY) {
        logger_1.logger.warn('Authorize.net credentials are not configured. Mocking payment approval.');
        return {
            transactionId: `mock_trans_${Date.now()}`,
            authCode: '123456',
        };
    }
    const isSandbox = env_1.env.AUTHORIZE_NET_ENVIRONMENT === 'sandbox';
    const url = isSandbox
        ? 'https://apitest.authorize.net/xml/v1/request.api'
        : 'https://api.authorize.net/xml/v1/request.api';
    const amountStr = (params.amountCents / 100).toFixed(2);
    const requestBody = {
        createTransactionRequest: {
            merchantAuthentication: {
                name: env_1.env.AUTHORIZE_NET_API_LOGIN_ID,
                transactionKey: env_1.env.AUTHORIZE_NET_TRANSACTION_KEY,
            },
            refId: `order_${Date.now()}`,
            transactionRequest: {
                transactionType: 'authCaptureTransaction',
                amount: amountStr,
                payment: {
                    opaqueData: {
                        dataDescriptor: params.opaqueDataDescriptor,
                        dataValue: params.opaqueDataValue,
                    },
                },
                customer: {
                    email: params.email,
                },
                billTo: {
                    firstName: params.billingAddress.firstName,
                    lastName: params.billingAddress.lastName,
                    address: params.billingAddress.address,
                    city: params.billingAddress.city,
                    state: params.billingAddress.state,
                    zip: params.billingAddress.zip,
                    country: params.billingAddress.country,
                },
                shipTo: {
                    firstName: params.shippingAddress.firstName,
                    lastName: params.shippingAddress.lastName,
                    address: params.shippingAddress.address,
                    city: params.shippingAddress.city,
                    state: params.shippingAddress.state,
                    zip: params.shippingAddress.zip,
                    country: params.shippingAddress.country,
                },
            },
        },
    };
    try {
        logger_1.logger.info({ amount: amountStr, email: params.email }, 'Sending transaction request to Authorize.net');
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
            throw new Error(`Authorize.net API error: ${response.statusText} (${response.status})`);
        }
        const rawText = await response.text();
        // Authorize.Net sometimes returns BOM character at the start, clean it
        const cleanedText = rawText.replace(/^\uFEFF/, '').trim();
        const resData = JSON.parse(cleanedText);
        if (resData.messages?.resultCode !== 'Ok') {
            const errMsg = resData.messages?.message?.[0]?.text || 'Authorize.net transaction failed';
            const errCode = resData.messages?.message?.[0]?.code || 'Unknown';
            throw (0, errorHandler_1.createError)(`Payment failed: ${errMsg} (Code: ${errCode})`, 400);
        }
        const transResponse = resData.transactionResponse;
        if (!transResponse) {
            throw (0, errorHandler_1.createError)('No transaction response returned from Authorize.net', 400);
        }
        if (transResponse.responseCode !== '1') {
            const errMsg = transResponse.errors?.[0]?.errorText ||
                transResponse.messages?.[0]?.description ||
                'Transaction declined';
            throw (0, errorHandler_1.createError)(`Payment declined: ${errMsg}`, 400);
        }
        logger_1.logger.info({ transactionId: transResponse.transId, authCode: transResponse.authCode }, 'Authorize.net transaction approved');
        return {
            transactionId: transResponse.transId,
            authCode: transResponse.authCode,
        };
    }
    catch (err) {
        logger_1.logger.error({ err, email: params.email }, 'Authorize.net charge transaction failed');
        throw err;
    }
}
//# sourceMappingURL=paymentService.js.map