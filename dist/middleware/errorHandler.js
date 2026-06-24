"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.createError = createError;
const logger_1 = require("./logger");
const zod_1 = require("zod");
function errorHandler(err, req, res, _next) {
    // Log the error
    logger_1.logger.error({
        err,
        req: {
            method: req.method,
            url: req.url,
            ip: req.ip,
        },
    }, 'Unhandled error');
    // Zod validation errors (shouldn't usually reach here, but just in case)
    if (err instanceof zod_1.ZodError) {
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
    const message = statusCode < 500
        ? err.message
        : process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message;
    res.status(statusCode).json({
        success: false,
        error: message,
    });
}
function createError(message, statusCode, code) {
    const error = new Error(message);
    error.statusCode = statusCode;
    if (code)
        error.code = code;
    return error;
}
//# sourceMappingURL=errorHandler.js.map