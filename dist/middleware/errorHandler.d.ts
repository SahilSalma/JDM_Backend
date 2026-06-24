import { Request, Response, NextFunction } from 'express';
export interface ApiError extends Error {
    statusCode?: number;
    code?: string;
}
export declare function errorHandler(err: ApiError, req: Request, res: Response, _next: NextFunction): void;
export declare function createError(message: string, statusCode: number, code?: string): ApiError;
//# sourceMappingURL=errorHandler.d.ts.map