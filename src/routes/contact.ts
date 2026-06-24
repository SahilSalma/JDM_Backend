import { Router, Request, Response, NextFunction } from 'express';
import { contactFormSchema } from '../validators/contact';
import { sendContactEmails } from '../services/emailService';
import { ZodError } from 'zod';

const router = Router();

router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = contactFormSchema.parse(req.body);

    await sendContactEmails(
      data.name,
      data.email,
      data.phone,
      data.subject,
      data.message,
    );

    res.status(200).json({
      success: true,
      message: 'Message received. We will get back to you shortly.',
    });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }
    next(err);
  }
});

export default router;
