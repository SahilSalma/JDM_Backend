import { z } from 'zod';

export const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?\d{7,15}$/, 'Phone number must be 7-15 digits').optional().or(z.literal('')),
  subject: z.string().min(1, 'Subject is required').max(300),
  message: z.string().min(1, 'Message is required').max(5000),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;
