
import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
    try {
        const { ticketId, message, userEmail, userName, ticketSubject } = await request.json();

        if (!ticketId || !message || !userEmail) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const ticketRef = firestore.collection('support_tickets').doc(ticketId);

        // Add reply to subcollection
        await ticketRef.collection('replies').add({
            sender_type: 'admin',
            message: message,
            created_at: new Date()
        });

        // Update ticket status and latest reply
        await ticketRef.update({
            status: 'replied',
            updated_at: new Date(),
            last_reply: {
                message: message,
                created_at: new Date(),
                sender_type: 'admin'
            }
        });

        // Send email asynchronously
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
        });

        return NextResponse.json({ message: 'Reply sent successfully' }, { status: 200 });

    } catch (error: any) {
        console.error('Reply Ticket Error:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
