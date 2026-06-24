import { z } from 'zod';
export declare const contactFormSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    subject: z.ZodString;
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
    name: string;
    email: string;
    subject: string;
    phone?: string | undefined;
}, {
    message: string;
    name: string;
    email: string;
    subject: string;
    phone?: string | undefined;
}>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;
//# sourceMappingURL=contact.d.ts.map