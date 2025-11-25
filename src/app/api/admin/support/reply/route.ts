import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
    try {
        const { ticketId, message, userEmail, userName, ticketSubject } = await request.json();

        if (!ticketId || !message || !userEmail) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        // Save reply to database
        await executeQuery({
            query: 'INSERT INTO ticket_replies (ticket_id, sender_type, message) VALUES (?, ?, ?)',
            values: [ticketId, 'admin', message],
        });

        // Update ticket status to replied
        await executeQuery({
            query: 'UPDATE support_tickets SET status = ? WHERE id = ?',
            values: ['replied', ticketId],
        });

        // Send email asynchronously (don't wait for it)
        sendEmail({
            to: userEmail,
            subject: `[Ticket #${ticketId}] Re: ${ticketSubject}`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2>Support Update</h2>
                    <p>Hi ${userName},</p>
                    <p>You have a new reply to your support ticket.</p>
                    <hr />
                    <p><strong>Reply:</strong></p>
                    <p>${message}</p>
                    <hr />
                    <p style="font-size: 0.9em; color: #666;">Ticket ID: #${ticketId}</p>
                </div>
            `,
        }).catch(err => {
            console.error('Failed to send email:', err);
            // Don't fail the request if email fails
        });

        // Return immediately after database updates
        return NextResponse.json({ message: 'Reply sent successfully' }, { status: 200 });

    } catch (error: any) {
        console.error('Reply Ticket Error:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
