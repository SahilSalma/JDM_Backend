import { Router } from 'express';
import {
  checkEligibility,
  create,
  createWithImages,
  getProductReviews,
  getHomepageReviews,
} from '../controllers/reviewController';
import { uploadReviewImages } from '../middleware/uploadReviewImages';

const router = Router();

router.post('/check-eligibility', checkEligibility);
router.post('/', uploadReviewImages.array('images', 5), createWithImages);
router.get('/product/:productId', getProductReviews);
router.get('/homepage', getHomepageReviews);

export default router;
