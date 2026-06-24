import pino from 'pino';
import { Request, Response, NextFunction } from 'express';
export declare const logger: pino.Logger<never, boolean>;
export declare function requestLogger(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=logger.d.ts.map