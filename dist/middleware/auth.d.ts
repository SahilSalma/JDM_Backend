import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    admin?: {
        id: string;
        email: string;
        name: string;
        role: string;
    };
}
export declare function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=auth.d.ts.map