import { Router } from 'express';
import {
  list,
  getBySlug,
  getMakes,
  getModels,
  getYears,
  search,
  getFeatured,
} from '../controllers/productController';

const router = Router();

router.get('/', list);
router.get('/makes', getMakes);
router.get('/featured', getFeatured);
router.get('/search', search);
router.get('/models/:make', getModels);
router.get('/years/:make/:model', getYears);
router.get('/:slug', getBySlug);

export default router;
