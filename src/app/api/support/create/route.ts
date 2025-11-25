import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
    try {
        const { name, email, subject, message } = await request.json();

        if (!name || !email || !subject || !message) {
            return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
        }

        // Save ticket to database
        const result = await executeQuery({
            query: 'INSERT INTO support_tickets (name, email, subject, message) VALUES (?, ?, ?, ?)',
            values: [name, email, subject, message],
        }) as any;

        const ticketId = result.insertId;

        // Send confirmation email to user
        await sendEmail({
            to: email,
            subject: `[Ticket #${ticketId}] Support Request Received: ${subject}`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2>Support Request Received</h2>
                    <p>Hi ${name},</p>
                    <p>Thank you for contacting The Kada Support. We have received your request and a support agent will get back to you shortly.</p>
                    <p><strong>Ticket ID:</strong> #${ticketId}</p>
                    <p><strong>Subject:</strong> ${subject}</p>
                    <hr />
                    <p><strong>Your Message:</strong></p>
                    <p>${message}</p>
                </div>
            `,
        });

        // Send notification to admin (optional, but good for real-time awareness)
        // We can reuse the ADMIN_EMAIL from env
        if (process.env.ADMIN_EMAIL) {
            await sendEmail({
                to: process.env.ADMIN_EMAIL,
                subject: `New Support Ticket #${ticketId}: ${subject}`,
                html: `
                    <div style="font-family: Arial, sans-serif; color: #333;">
                        <h2>New Support Ticket</h2>
                        <p><strong>From:</strong> ${name} (${email})</p>
                        <p><strong>Ticket ID:</strong> #${ticketId}</p>
                        <p><strong>Subject:</strong> ${subject}</p>
                        <hr />
                        <p><strong>Message:</strong></p>
                        <p>${message}</p>
                    </div>
                `,
            });
        }

        return NextResponse.json({ message: 'Ticket created successfully', ticketId }, { status: 201 });

    } catch (error: any) {
        console.error('Create Ticket Error:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
