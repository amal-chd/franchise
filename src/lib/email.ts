import nodemailer from 'nodemailer';

// Debug: Log environment variables on module load
console.log('🔧 Email module loaded');
console.log('Environment variables check:', {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS ? `${process.env.SMTP_PASS.substring(0, 4)}...${process.env.SMTP_PASS.substring(process.env.SMTP_PASS.length - 4)}` : 'NOT SET',
    SMTP_FROM: process.env.SMTP_FROM,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
});

// Create reusable transporter
const smtpPort = parseInt(process.env.SMTP_PORT || '587');
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    attachments?: Array<{
        filename: string;
        content: string | Buffer; // Base64 string or Buffer
        encoding?: string; // 'base64' if content is base64 string
    }>;
}

export async function sendEmail({ to, subject, html, attachments }: EmailOptions) {
    try {
        console.log('📧 Attempting to send email...');
        console.log('SMTP Config:', {
            host: process.env.SMTP_HOST,
            port: smtpPort,
            secure: smtpPort === 465,
            user: process.env.SMTP_USER,
            from: process.env.SMTP_FROM,
        });

        // Verify transporter configuration
        console.log('🔍 Verifying SMTP connection...');
        await transporter.verify();
        console.log('✅ SMTP connection verified');

        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"The Kada Franchise" <noreply@thekada.in>',
            to,
            subject,
            html,
            attachments,
        });

        console.log('✅ Email sent successfully:', info.messageId);
        console.log('📬 Sent to:', to);
        return { success: true, messageId: info.messageId };
    } catch (error: any) {
        console.error('❌ Email sending failed:', error);
        console.error('Error details:', {
            message: (error as Error).message,
            code: (error as any).code,
            command: (error as any).command,
        });
        return { success: false, error };
    }
}
