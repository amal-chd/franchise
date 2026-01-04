import { NextResponse } from 'next/server';

import { supabase } from '@/lib/supabaseClient';
// import executeQuery from '@/lib/db'; // Removed Main DB dependency
import executeFranchiseQuery from '@/lib/franchise_db'; // Franchise read-only database
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

        console.log('DEBUG Analytics - Fetching fresh data (PARALLEL)');
        const startTime = Date.now();

        // OPTIMIZATION: Run ALL queries in parallel for maximum speed
        const [
            franchiseStatsResult,
            ticketsStatsResult,
            ordersQueryResult,
            franchisePlansResult,
            revenueTrendsResult,
            statusDistResult,
            zonePerfResult
        ] = await Promise.all([
            // 1. Franchise stats (Supabase)
            (async () => {
                const { count: totalRequests } = await supabase.from('franchise_requests').select('*', { count: 'exact', head: true });
                const { count: pendingVerification } = await supabase.from('franchise_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending_verification');
                const { count: activeFranchises } = await supabase.from('franchise_requests').select('*', { count: 'exact', head: true }).eq('status', 'approved');
                return [{ totalRequests, pendingVerification, activeFranchises }];
            })(),

            // 2. Support tickets stats (Supabase)
            (async () => {
                const { count: pendingTickets } = await supabase.from('support_tickets').select('*', { count: 'exact', head: true }).in('status', ['open', null]);
                // Fix: Supabase .in_ doesn't handle null well usually. Filter separately or simplify. 
                // Let's just count 'open'.
                // const { count: pendingTickets } = await supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open');
                // Actually let's assume default is open.
                const { data: openTickets } = await supabase.from('support_tickets').select('status');
                const pending = openTickets?.filter(t => t.status === 'open' || !t.status).length || 0;

                const { count: repliedTickets } = await supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'replied');
                return [{ pendingTickets: pending, repliedTickets }];
            })(),

            // 3. Orders by zone (franchise DB)
            executeFranchiseQuery({
                query: `
                    SELECT 
                        o.zone_id,
                        SUM(ot.admin_commission) as totalAdminCommission,
                        COUNT(DISTINCT o.id) as totalDeliveredOrders
                    FROM orders o
                    INNER JOIN order_transactions ot ON o.id = ot.order_id
                    WHERE o.order_status = 'delivered'
                    GROUP BY o.zone_id
                `,
                values: [],
            }),

            // 4. Franchise plans (Supabase)
            (async () => {
                const { data } = await supabase.from('franchise_requests').select('zone_id, plan_selected').eq('status', 'approved').not('zone_id', 'is', null);
                return data || [];
            })(),

            // 5. Revenue trends (franchise DB)
            executeFranchiseQuery({
                query: `
                    SELECT 
                        DATE_FORMAT(created_at, '%Y-%m') as month,
                        SUM(order_amount) as revenue
                    FROM orders
                    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
                    AND order_status = 'delivered'
                    GROUP BY month
                    ORDER BY month ASC
                `,
                values: [],
            }),

            // 6. Status distribution (franchise DB)
            executeFranchiseQuery({
                query: `
                    SELECT 
                        order_status as status,
                        COUNT(*) as count
                    FROM orders
                    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                    GROUP BY order_status
                `,
                values: [],
            }),

            // 7. Zone performance (franchise DB)
            executeFranchiseQuery({
                query: `
                    SELECT 
                        z.name as zone,
                        COUNT(o.id) as orders,
                        SUM(o.order_amount) as revenue
                    FROM orders o
                    JOIN zones z ON o.zone_id = z.id
                    WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                    AND o.order_status = 'delivered'
                    GROUP BY z.id, z.name
                    ORDER BY revenue DESC
                    LIMIT 5
                `,
                values: [],
            })
        ]);

        // Process franchise stats


        // Process franchise stats
        const franchiseStats = franchiseStatsResult as any[];
        const totalRequests = parseInt(franchiseStats[0]?.totalRequests || 0);
        const pendingVerification = parseInt(franchiseStats[0]?.pendingVerification || 0);
        const activeFranchises = parseInt(franchiseStats[0]?.activeFranchises || 0);

        // Process tickets stats
        const ticketsStats = ticketsStatsResult as any[];
        const pendingTickets = ticketsStats[0]?.pendingTickets || 0;
        const repliedTickets = ticketsStats[0]?.repliedTickets || 0;

        // Build zone -> plan mapping
        const zonePlanMap: { [key: number]: string } = {};
        (franchisePlansResult as any[]).forEach((f: any) => {
            if (f.zone_id) zonePlanMap[f.zone_id] = f.plan_selected || 'free';
        });

        // Calculate company revenue
        const ordersResult = Array.isArray(ordersQueryResult) ? ordersQueryResult : [];
        let companyRevenue = 0;
        let totalOrders = 0;

        ordersResult.forEach((zone: any) => {
            const zoneId = zone.zone_id;
            const adminCommission = parseFloat(zone.totalAdminCommission || 0);
            const orders = parseInt(zone.totalDeliveredOrders || 0);
            const plan = zonePlanMap[zoneId] || 'free';
            const companyShare = COMPANY_SHARE[plan] || 0.70;

            const zoneCompanyRevenue = (adminCommission * companyShare) + (orders * PLATFORM_CHARGE);
            companyRevenue += zoneCompanyRevenue;
            totalOrders += orders;
        });

        const queryTime = Date.now() - startTime;
        console.log(`DEBUG Analytics - All queries completed in ${queryTime}ms`);

        const responseData = {
            totalRequests,
            pendingVerification,
            activeFranchises,
            totalRevenue: Math.round(companyRevenue * 100) / 100,
            totalOrders,
            pendingTickets,
            repliedTickets,
            trends: {
                revenue: revenueTrendsResult || [],
                statusDistribution: statusDistResult || [],
                zonePerformance: zonePerfResult || []
            },
            _timestamp: Date.now(),
            _queryTime: queryTime + 'ms'
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
