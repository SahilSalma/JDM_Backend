import { Router, Request, Response } from 'express';

const router = Router();

// Stripe webhook deprecated — return 200 OK for backward compatibility
router.post('/stripe', (req: Request, res: Response) => {
  res.json({ received: true, message: 'Webhook deprecated. Stripe has been replaced with Authorize.net.' });
});

export default router;
