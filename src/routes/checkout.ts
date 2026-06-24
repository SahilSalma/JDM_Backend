import { Router } from 'express';
import {
  confirmOrder,
} from '../controllers/checkoutController';
import { validate } from '../middleware/validate';
import { confirmOrderSchema } from '../validators/checkout';
import { checkoutRateLimit } from '../middleware/rateLimit';

const router = Router();

router.post(
  '/confirm',
  checkoutRateLimit,
  validate(confirmOrderSchema),
  confirmOrder,
);

export default router;
