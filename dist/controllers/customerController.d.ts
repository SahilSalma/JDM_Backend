import { Request, Response, NextFunction } from 'express';
/**
 * List all unique customers grouped by email.
 * Returns order count, lifetime value, and last order date.
 */
export declare function listCustomers(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * Get detailed customer profile by email.
 * Returns customer info, all orders with items, and aggregated stats.
 */
export declare function getCustomerDetails(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * Public subscription handler for newsletter.
 */
export declare function subscribeNewsletter(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=customerController.d.ts.map