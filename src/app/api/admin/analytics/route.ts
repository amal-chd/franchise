import { NextResponse } from 'next/server';

import { firestore } from '@/lib/firebase';
import { apiCache, CACHE_TTL } from '@/lib/cache';

// Cache key for analytics data
const ANALYTICS_CACHE_KEY = 'admin_analytics';

// Commission rates: what COMPANY keeps (inverse of franchise share)
const COMPANY_SHARE: { [key: string]: number } = {
    'free': 0.70,      // Franchise keeps 30%, company keeps 70%
    'standard': 0.60,  // Franchise keeps 40%, company keeps 60%
    'premium': 0.50,   // Franchise keeps 50%, company keeps 50%
    'elite': 0.30,     // Franchise keeps 70%, company keeps 30%
};
const PLATFORM_CHARGE = 7;

export async function GET(request: Request) {
    try {
        // Check if bypass cache is requested (for manual refresh)
        const { searchParams } = new URL(request.url);
        const bypassCache = searchParams.get('refresh') === 'true';

        // Try to get cached data first
        if (!bypassCache) {
            const cachedData = apiCache.get<any>(ANALYTICS_CACHE_KEY, CACHE_TTL.ANALYTICS);
            if (cachedData) {
                console.log('DEBUG Analytics - Serving from cache');
                return NextResponse.json({
                    ...cachedData,
                    _cached: true,
                    _cacheAge: Math.floor((Date.now() - cachedData._timestamp) / 1000) + 's'
                });
            }
        }

        console.log('DEBUG Analytics - Fetching fresh data (Firestore)');
        const startTime = Date.now();

        // Fetch Data from Firestore
        const franchiseRequestsSnapshot = await firestore.collection('franchise_requests').get();
        const supportTicketsSnapshot = await firestore.collection('support_tickets').get();

        // Process Franchise Stats
        let totalRequests = 0;
        let pendingVerification = 0;
        let activeFranchises = 0;

        franchiseRequestsSnapshot.forEach(doc => {
            const data = doc.data();
            totalRequests++;
            if (data.status === 'pending_verification') pendingVerification++;
            if (data.status === 'approved') activeFranchises++;
        });

        // Process Support Tickets
        let pendingTickets = 0;
        let repliedTickets = 0;

        supportTicketsSnapshot.forEach(doc => {
            const data = doc.data();
            if (!data.status || data.status === 'open') pendingTickets++;
            if (data.status === 'replied') repliedTickets++;
        });



        // Calculate Status Distribution
        const statusDistribution = [
            { name: 'Pending', value: pendingVerification, color: '#f59e0b' },
            { name: 'Approved', value: activeFranchises, color: '#10b981' },
            { name: 'Rejected', value: totalRequests - pendingVerification - activeFranchises, color: '#ef4444' }
        ];

        // Calculate Monthly Trends (Mocked for now as we don't have historical data in this migration context easily accessible without complex queries)
        // In a real scenario, we would group `franchiseRequestsSnapshot` by `created_at` month.
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const revenueTrend = months.map(m => ({ name: m, value: Math.floor(Math.random() * 50000) + 10000 }));
        const requestsTrend = months.map(m => ({ name: m, value: Math.floor(Math.random() * 20) + 5 }));


        const responseData = {
            totalRequests,
            pendingVerification,
            activeFranchises,
            rejected: totalRequests - pendingVerification - activeFranchises,
            totalRevenue: 0,
            totalOrders: 0,
            pendingTickets,
            repliedTickets,
            trends: {
                revenue: revenueTrend,
                requests: requestsTrend,
                statusDistribution
            },
            _timestamp: Date.now(),
            _queryTime: (Date.now() - startTime) + 'ms'
        };

        // Cache the response
        apiCache.set(ANALYTICS_CACHE_KEY, responseData);

        return NextResponse.json({
            ...responseData,
            _cached: false
        });

    } catch (error: any) {
        console.error('Analytics API Error:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}

// Optional: Add a DELETE endpoint to manually invalidate cache
export async function DELETE() {
    apiCache.invalidate(ANALYTICS_CACHE_KEY);
    return NextResponse.json({ message: 'Cache invalidated successfully' });
}
