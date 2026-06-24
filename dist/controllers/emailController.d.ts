import { Request, Response, NextFunction } from 'express';
export declare function send(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getTemplates(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getLog(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getLogEntry(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function retryEmail(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getLogByRecipient(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=emailController.d.ts.map