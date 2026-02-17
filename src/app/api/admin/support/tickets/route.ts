
import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';

export async function GET() {
    try {
        const snapshot = await firestore.collection('support_tickets')
            .orderBy('created_at', 'desc')
            .get();

        const tickets = snapshot.docs.map((doc: any) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Ensure date objects are serialized if needed, though Nextjs json response handles standard dates often, 
                // Firestore timestamps need conversion usually.
                created_at: data.created_at?.toDate?.() || data.created_at,
                // Mapping denormalized last_reply to latest_reply to match previous frontend expectation
                latest_reply: data.last_reply?.message || null,
                franchise_name: data.franchise_name || 'Unknown',
                zone_name: data.zone_name || 'N/A'
            };
        });

        return NextResponse.json(tickets);

    } catch (error: any) {
        console.error('Fetch Tickets Error:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
