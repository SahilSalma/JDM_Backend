export declare function sendOrderConfirmation(order: any): Promise<void>;
export declare function sendOrderNotification(order: any, theme?: string): Promise<void>;
export declare function sendShippingConfirmation(order: any): Promise<void>;
export declare function sendCustomEmail(to: string, subject: string, body: string, templateEnabled?: boolean, attachments?: Array<{
    filename: string;
    path?: string;
    content?: string;
}>, orderId?: string, theme?: string): Promise<void>;
export declare function resendEmail(logId: string): Promise<void>;
export declare function sendContactEmails(name: string, email: string, phone: string | undefined, subject: string, message: string): Promise<void>;
export declare function getEmailLogById(logId: string): Promise<{
    status: "failed" | "sent" | "bounced";
    id: string;
    order_id: string | null;
    recipient_email: string;
    template_used: string | null;
    subject: string;
    body_content: string | null;
    has_attachment: boolean;
    sent_at: string;
} | undefined>;
export declare function getEmailTemplates(): string[];
//# sourceMappingURL=emailService.d.ts.map