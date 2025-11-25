import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { requestId } = body;

        if (!requestId) {
            return NextResponse.json({ message: 'Request ID is required' }, { status: 400 });
        }

        await executeQuery({
            query: 'UPDATE franchise_requests SET agreement_accepted = TRUE, status = ? WHERE id = ?',
            values: ['pending_verification', requestId],
        });

        // Fetch user details for email
        const userResult = await executeQuery({
            query: 'SELECT * FROM franchise_requests WHERE id = ?',
            values: [requestId],
        });

        const user = (userResult as any)[0];

        if (user) {
            const { name, email, phone, city } = user;
            const applicationData = { name, email, phone, city, requestId };

            // Send email notifications
            const { sendEmail } = await import('@/lib/email');
            const { newApplicationEmail, applicationSubmittedEmail } = await import('@/lib/emailTemplates');

            Promise.all([
                // Send confirmation email to applicant
                sendEmail({
                    to: email,
                    subject: 'Application Received - The Kada Franchise',
                    html: applicationSubmittedEmail(applicationData),
                }),
                // Send notification to admin
                sendEmail({
                    to: process.env.ADMIN_EMAIL || 'thekadaapp@gmail.com',
                    subject: `New Franchise Application from ${name} - ${city}`,
                    html: newApplicationEmail(applicationData),
                }),
            ]).catch(error => {
                console.error('Email notification error:', error);
            });
        }

        return NextResponse.json({ message: 'Agreement accepted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Agreement Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
