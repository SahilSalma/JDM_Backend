import { Router } from 'express';
import { list, getBySlug } from '../controllers/blogController';

const router = Router();

// Public blog routes
router.get('/', list);
router.get('/:slug', getBySlug);

export default router;
