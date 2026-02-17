import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';


export async function GET() {
    try {
        const snapshot = await firestore.collection('newsletter_subscribers')
            .orderBy('subscribed_at', 'desc')
            .get();

        const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error fetching subscribers:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
