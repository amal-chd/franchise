import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';
import { sendNotification } from '@/lib/notifications';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            name, email, phone, city, password,
            upi_id, bank_account_number, ifsc_code, bank_name
        } = body;

        if (!name || !email || !phone || !city || !password) {
            return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
        }

        // Check if email or phone already exists
        const emailCheck = await firestore.collection('franchise_requests').where('email', '==', email).limit(1).get();
        if (!emailCheck.empty) {
            return NextResponse.json({ message: 'Email already registered' }, { status: 409 });
        }

        const phoneCheck = await firestore.collection('franchise_requests').where('phone', '==', phone).limit(1).get();
        if (!phoneCheck.empty) {
            return NextResponse.json({ message: 'Phone already registered' }, { status: 409 });
        }

        const newFranchise = {
            name,
            email,
            phone,
            city,
            password, // Warning: Storing plain text based on previous logic. Should hash in real app.
            plan_selected: 'free',
            status: 'pending_verification',
            agreement_accepted: false,
            budget: 'Standard',
            upi_id: upi_id || null,
            bank_account_number: bank_account_number || null,
            ifsc_code: ifsc_code || null,
            bank_name: bank_name || null,
            created_at: new Date()
        };

        const docRef = await firestore.collection('franchise_requests').add(newFranchise);
        const franchiseId = docRef.id;

        // Trigger notification for Admin
        try {
            await sendNotification({
                title: 'New Franchise Request',
                message: `New franchise request from ${name} (${city})`,
                type: 'franchise',
                data: { franchiseId, name, city }
            });
        } catch (notifError) {
            console.error('Failed to send admin notification:', notifError);
        }

        return NextResponse.json({
            message: 'Franchise registered successfully',
            franchiseId: franchiseId
        }, { status: 201 });
    } catch (error: any) {
        console.error('Register API Error:', error);
        return NextResponse.json({
            message: 'Internal Server Error',
            details: error?.message || 'Unknown error'
        }, { status: 500 });
    }
}
