import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const email = searchParams.get('email');

    if (!id && !email) {
        return NextResponse.json({ error: 'Franchise ID or Email is required' }, { status: 400 });
    }

    try {
        let franchiseData = null;

        if (id) {
            const doc = await firestore.collection('franchise_requests').doc(id).get();
            if (doc.exists) {
                franchiseData = { id: doc.id, ...doc.data() };
            }
        } else if (email) {
            const snapshot = await firestore.collection('franchise_requests').where('email', '==', email).limit(1).get();
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                franchiseData = { id: doc.id, ...doc.data() };
            }
        }

        if (franchiseData) {
            // Filter fields if needed (e.g. remove sensitive data like password hash if stored)
            return NextResponse.json(franchiseData);
        }

        return NextResponse.json({ error: 'Franchise not found' }, { status: 404 });
    } catch (error: any) {
        console.error('Profile Fetch Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const data = await request.json();
        const { id, name, phone, city, upi_id, bank_account_number, ifsc_code, bank_name, password } = data;

        if (!id) {
            return NextResponse.json({ error: 'Franchise ID is required' }, { status: 400 });
        }

        const updateData: any = {
            name, phone, city, upi_id, bank_account_number, ifsc_code, bank_name
        };

        if (password && password.trim().length > 0) {
            updateData.password = password; // Should hash password in real app if storing directly
        }

        await firestore.collection('franchise_requests').doc(String(id)).update(updateData);

        return NextResponse.json({ success: true, message: 'Profile updated successfully' });
    } catch (error: any) {
        console.error('Profile Update Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
