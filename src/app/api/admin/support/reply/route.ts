import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
    try {
        const { ticketId, message, userEmail, userName, ticketSubject } = await request.json();

        if (!ticketId || !message || !userEmail) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        // Save reply to Supabase
        const { error: replyError } = await supabase
            .from('ticket_replies')
            .insert([{
                ticket_id: ticketId,
                sender_type: 'admin',
                message: message
            }]);

        if (replyError) throw replyError;

        // Update ticket status to replied
        const { error: updateError } = await supabase
            .from('support_tickets')
            .update({ status: 'replied' })
            .eq('id', ticketId);

        if (updateError) throw updateError;

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
