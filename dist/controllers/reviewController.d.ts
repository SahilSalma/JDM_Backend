import { Request, Response, NextFunction } from 'express';
export declare function checkEligibility(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function create(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function createWithImages(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getProductReviews(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getHomepageReviews(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function listReviews(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getById(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function remove(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function update(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getManualPickList(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function setFeatured(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function uploadImages(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=reviewController.d.ts.map