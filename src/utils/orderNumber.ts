/**
 * Generate a unique order number in the format JDM-YYYYMMDD-XXXX
 * where XXXX is a random 4-character alphanumeric suffix.
 */
export function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const datePart = `${year}${month}${day}`;

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `JDM-${datePart}-${suffix}`;
}
