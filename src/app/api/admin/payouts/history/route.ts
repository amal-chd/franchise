
import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const month = searchParams.get('month');
        const year = searchParams.get('year');

        let query: any = firestore.collection('payout_logs').orderBy('payout_date', 'desc');

        if (month && year) {
            const startDate = new Date(`${year}-${month.toString().padStart(2, '0')}-01`);
            // Calculate end date (start of next month)
            const nextMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1;
            const nextYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year);
            const endDate = new Date(`${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`);

            query = query.where('payout_date', '>=', startDate).where('payout_date', '<', endDate);
        }

        const snapshot = await query.get();
        const logs = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

        // Manual Join to get Franchise details
        // Collect unique franchise IDs
        const franchiseIds = [...new Set(logs.map((log: any) => log.franchise_id))];

        // Fetch franchises in bulk (if feasible, otherwise fetch all active or one by one)
        // Firestore 'in' query supports up to 10 items. If we have more, we might need a different strategy.
        // For admin dashboard logs, simplistic approach: Fetch ALL approved franchises and map, OR fetch specific if list is small.
        // Let's assume fetching all approved franchises is efficient enough for now (likely < 1000).

        const franchisesSnapshot = await firestore.collection('franchise_requests').get();
        const franchisesMap = new Map();
        franchisesSnapshot.forEach((doc: any) => {
            franchisesMap.set(doc.id, doc.data());
        });

        const results = logs.map((log: any) => {
            const franchise = franchisesMap.get(log.franchise_id);
            return {
                ...log,
                franchise_name: franchise?.name || 'Unknown',
                city: franchise?.city || 'Unknown',
                // convert firestore timestamp to date string for frontend if needed, keeping simple for now
                payout_date: log.payout_date?.toDate ? log.payout_date.toDate().toISOString() : log.payout_date
            };
        });

        return NextResponse.json(results);
    } catch (error: any) {
        console.error('Error fetching payout history:', error);
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}
