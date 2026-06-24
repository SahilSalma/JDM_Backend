"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.requestLogger = requestLogger;
const pino_1 = __importDefault(require("pino"));
const env_1 = require("../config/env");
exports.logger = (0, pino_1.default)({
    level: env_1.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: env_1.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
            },
        }
        : undefined,
});
function requestLogger(req, res, next) {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        exports.logger.info({
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        }, `${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
    });
    next();
}
//# sourceMappingURL=logger.js.map