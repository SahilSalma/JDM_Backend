import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type ValidationTarget = 'body' | 'params' | 'query';

export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
      return;
    }
    // Replace request data with parsed/transformed data
    (req as unknown as Record<string, unknown>)[target] = result.data;
    next();
  };
}
