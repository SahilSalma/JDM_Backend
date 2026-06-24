import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare function update(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function getLog(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=inventoryController.d.ts.map