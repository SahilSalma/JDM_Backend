import { Router } from 'express';
import { getRate, getAllRates } from '../controllers/shippingController';

const router = Router();

// Get all rates (optionally for a specific state)
router.get('/rates', getAllRates);

// Get rate for a specific type + state
router.get('/rate', getRate);

export default router;
