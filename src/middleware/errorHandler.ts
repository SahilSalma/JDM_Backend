import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';
import { ZodError } from 'zod';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Log the error
  logger.error(
    {
      err,
      req: {
        method: req.method,
        url: req.url,
        ip: req.ip,
      },
    },
    'Unhandled error',
  );

  // Zod validation errors (shouldn't usually reach here, but just in case)
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.flatten().fieldErrors,
    });
    return;
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({
      success: false,
      error: 'File too large. Maximum size is 10MB.',
    });
    return;
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    res.status(400).json({
      success: false,
      error: 'Too many files. Maximum is 10 files per upload.',
    });
    return;
  }

  // Known application errors
  const statusCode = err.statusCode ?? 500;
  const message =
    statusCode < 500
      ? err.message
      : process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message;

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}

export function createError(message: string, statusCode: number, code?: string): ApiError {
  const error: ApiError = new Error(message);
  error.statusCode = statusCode;
  if (code) error.code = code;
  return error;
}
