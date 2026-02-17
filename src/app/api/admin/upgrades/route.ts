
import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';

export async function GET() {
    try {
        const snapshot = await firestore.collection('plan_upgrade_logs')
            .orderBy('created_at', 'desc')
            .get();

        const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Manual Join for Franchise Details
        // Ideally, we should fetch only relevant franchises, but fetching all is simpler for initial migration
        const franchisesSnapshot = await firestore.collection('franchise_requests').get();
        const franchisesMap = new Map();
        franchisesSnapshot.forEach(doc => {
            franchisesMap.set(doc.id, doc.data());
        });

        const results = logs.map((log: any) => {
            const franchise = franchisesMap.get(log.franchise_id);
            return {
                ...log,
                franchise_requests: franchise ? {
                    name: franchise.name,
                    email: franchise.email,
                    phone: franchise.phone
                } : null,
                created_at: log.created_at?.toDate ? log.created_at.toDate().toISOString() : log.created_at
            };
        });

        return NextResponse.json(results);
    } catch (error: any) {
        console.error('Fetch Upgrades Logs Error:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
