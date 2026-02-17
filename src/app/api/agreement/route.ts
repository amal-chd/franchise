import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';
// import executeQuery from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { newApplicationEmail, applicationSubmittedEmail } from '@/lib/emailTemplates';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { requestId } = body;

        if (!requestId) {
            return NextResponse.json({ message: 'Request ID is required' }, { status: 400 });
        }

        const docRef = firestore.collection('franchise_requests').doc(String(requestId));
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return NextResponse.json({ message: 'Application not found' }, { status: 404 });
        }

        // Update agreement and status
        await docRef.update({
            agreement_accepted: true,
            status: 'pending_verification'
        });

        const user = docSnap.data();

        if (user) {
            const { name, email, phone, city } = user;
            const applicationData = { name, email, phone, city, requestId };

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
    } catch (error: any) {
        console.error('Agreement Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
