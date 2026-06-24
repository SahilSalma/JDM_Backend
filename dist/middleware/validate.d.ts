import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
type ValidationTarget = 'body' | 'params' | 'query';
export declare function validate(schema: ZodSchema, target?: ValidationTarget): (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=validate.d.ts.map