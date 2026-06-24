import { Request, Response, NextFunction } from 'express';
export declare function getEmailTemplatesController(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getEmailTemplateById(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function createEmailTemplate(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function updateEmailTemplate(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function deleteEmailTemplate(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getOrderNotificationRecipients(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function createOrderNotificationRecipient(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function updateOrderNotificationRecipient(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function deleteOrderNotificationRecipient(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getSubscriptions(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function deleteSubscription(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getNavbarSettings(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function updateNavbarSettings(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=emailTemplateController.d.ts.map