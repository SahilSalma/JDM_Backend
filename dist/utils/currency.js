"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.centsToDollars = centsToDollars;
exports.dollarsToCents = dollarsToCents;
exports.formatPrice = formatPrice;
/**
 * Convert cents (integer) to dollars (float)
 */
function centsToDollars(cents) {
    return cents / 100;
}
/**
 * Convert dollars (float) to cents (integer), rounding to nearest cent
 */
function dollarsToCents(dollars) {
    return Math.round(dollars * 100);
}
/**
 * Format cents as a USD price string, e.g. "$1,234.56"
 */
function formatPrice(cents) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(centsToDollars(cents));
}
//# sourceMappingURL=currency.js.map