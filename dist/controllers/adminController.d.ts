import { Request, Response, NextFunction } from 'express';
export declare function login(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function logout(req: Request, res: Response): void;
export declare function changePassword(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getStats(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getSettings(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function updateSettings(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function bulkUpdateSettings(req: Request, res: Response, next: NextFunction): Promise<void>;
/** Public endpoint — returns all non-sensitive settings as key-value map */
export declare function getPublicSettings(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=adminController.d.ts.map