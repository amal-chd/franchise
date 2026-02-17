
import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';

import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { subject, html, recipientType, customRecipients } = body;

        if (!subject || !html || !recipientType) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let recipients: string[] = [];

        if (recipientType === 'custom' && Array.isArray(customRecipients)) {
            recipients = customRecipients;
        } else if (recipientType === 'subscribers') {
            const snapshot = await firestore.collection('newsletter_subscribers')
                .where('status', '==', 'active')
                .get();

            recipients = snapshot.docs.map(doc => doc.data().email);

        } else if (recipientType === 'all_franchises') {
            // Fetch from franchise_requests where status is approved (assuming active franchises)
            // or check 'profiles' if implemented
            const snapshot = await firestore.collection('franchise_requests')
                .where('status', '==', 'approved')
                .get();

            recipients = snapshot.docs.map(doc => doc.data().email).filter((e: any) => e);
        }

        if (recipients.length === 0) {
            return NextResponse.json({ message: 'No recipients found' });
        }

        // Send emails in parallel (chunked if needed for large lists, but fine for now)
        // For larger scale, a queue system (Bull/Redis) is recommended.
        console.log(`Sending bulk email to ${recipients.length} recipients`);

        let sentCount = 0;
        let failedCount = 0;

        const results = await Promise.all(recipients.map(async (email) => {
            const result = await sendEmail({ to: email, subject, html });
            if (result.success) sentCount++;
            else failedCount++;
            return result;
        }));

        return NextResponse.json({
            success: true,
            sent: sentCount,
            failed: failedCount,
            total: recipients.length,
            details: results // For debugging
        });

    } catch (error: any) {
        console.error('Bulk Email Error:', error);
        return NextResponse.json({ error: 'Failed to send bulk emails', details: error.message }, { status: 500 });
    }
}
