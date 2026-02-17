
import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const snapshot = await firestore.collection('franchise_requests')
            .where('status', '==', 'approved')
            .orderBy('name', 'asc')
            .get();

        const results = snapshot.docs.map((doc: any) => {
            const f = doc.data();
            return {
                id: doc.id,
                full_name: f.name,
                email: f.email,
                phone: f.phone,
                city: f.city,
                upi_id: f.upi_id,
                bank_account_number: f.bank_account_number,
                ifsc_code: f.ifsc_code,
                bank_name: f.bank_name,
                plan_selected: f.pricing_plan,
                status: f.status
            };
        });

        return NextResponse.json(results);
    } catch (error: any) {
        console.error('Fetch Payouts Error:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
