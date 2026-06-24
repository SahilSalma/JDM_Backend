/**
 * Convert cents (integer) to dollars (float)
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Convert dollars (float) to cents (integer), rounding to nearest cent
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Format cents as a USD price string, e.g. "$1,234.56"
 */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(centsToDollars(cents));
}
