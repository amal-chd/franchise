import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';
// import { sendEmail } from '@/lib/email';
// import { newApplicationEmail, applicationSubmittedEmail } from '@/lib/emailTemplates';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, phone, city, upi_id, bank_account_number, ifsc_code, bank_name } = body;

        if (!name || !email || !phone || !city) {
            return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
        }

        const docRef = await firestore.collection('franchise_requests').add({
            name,
            email,
            phone,
            city,
            source: 'web_onboarding',
            state: 'N/A',
            plan_selected: 'standard',
            budget: 'N/A',
            status: 'pending',
            agreement_accepted: false,
            upi_id: upi_id || null,
            bank_account_number: bank_account_number || null,
            ifsc_code: ifsc_code || null,
            bank_name: bank_name || null,
            created_at: new Date()
        });

        const requestId = docRef.id;
        // const applicationData = { name, email, phone, city, requestId };

        // Email notifications are now deferred until the agreement step

        return NextResponse.json({
            message: 'Application submitted successfully',
            requestId
        }, { status: 201 });
    } catch (error: any) {
        console.error('Request Error:', error);
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
