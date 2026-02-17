import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const snapshot = await firestore.collection('chat_sessions')
            .orderBy('updated_at', 'desc')
            .get();

        const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Fetch Franchise Details
        const franchiseIds = [...new Set(sessions.map((s: any) => s.franchise_id).filter((id: any) => id))];
        const franchiseMap: Record<string, any> = {};

        if (franchiseIds.length > 0) {
            await Promise.all(franchiseIds.map(async (fid: any) => {
                const fDoc = await firestore.collection('franchise_requests').doc(fid).get();
                if (fDoc.exists) {
                    franchiseMap[fid] = fDoc.data();
                }
            }));
        }

        // Map fields
        const formattedSessions = sessions.map((s: any) => {
            const f = franchiseMap[s.franchise_id] || {};
            return {
                id: s.id,
                status: s.status,
                franchise_id: s.franchise_id,
                created_at: s.created_at?.toDate ? s.created_at.toDate() : s.created_at,
                last_message_at: s.last_message_time?.toDate ? s.last_message_time.toDate() : (s.updated_at?.toDate ? s.updated_at.toDate() : s.created_at),
                franchise_name: f.name || 'Unknown',
                franchise_email: f.email,
                franchise_phone: f.phone,
                franchise_city: f.city,
                plan: f.plan_selected || 'free', // legacy pricing_plan -> plan_selected
                last_message_preview: s.last_message,
                // last_sender_type is usually stored in session or inferred
                last_sender_type: s.last_sender_type
            };
        });

        return NextResponse.json(formattedSessions);
    } catch (error: any) {
        console.error('Admin Sessions Error:', error);
        return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }
}
