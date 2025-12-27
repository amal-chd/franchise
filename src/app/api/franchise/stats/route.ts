import { NextResponse } from 'next/server';
import executeQuery from '@/lib/franchise_db';
import executeMainQuery from '@/lib/db'; // Main database for franchise_requests
import { apiCache, CACHE_TTL } from '@/lib/cache';

// CONFIGURATION: Franchise Revenue Share Percentages (matching payout algorithm)
// These percentages represent what the FRANCHISE KEEPS from gross revenue
// Formula: Gross Share = (Revenue × SharePercent) / 100
//         Net Payout = Gross Share - (Orders × Platform Charge)
const COMMISSION_RATES: { [key: string]: number } = {
    'free': 0.30,      // Free plan: franchise keeps 30% of revenue
    'standard': 0.40,  // Standard plan: franchise keeps 40% of revenue
    'premium': 0.50,   // Premium plan: franchise keeps 50% of revenue
    'elite': 0.70,     // Elite plan: franchise keeps 70% of revenue
};

const PLATFORM_CHARGE_PER_ORDER = 7; // ₹7 per order platform charge
const ADMIN_COMMISSION_RATE = 0.10; // Admin gets 10% of gross revenue (from business_settings)

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get('zoneId');
    const bypassCache = searchParams.get('refresh') === 'true';

    if (!zoneId) {
        return NextResponse.json({ error: 'Zone ID is required' }, { status: 400 });
    }

    try {
        // Check cache first
        const cacheKey = `franchise_stats_${zoneId}`;

        if (!bypassCache) {
            const cachedData = apiCache.get<any>(cacheKey, CACHE_TTL.FRANCHISE_STATS);
            if (cachedData) {
                console.log(`DEBUG: Serving cached stats for Zone ${zoneId}`);
                return NextResponse.json({
                    ...cachedData,
                    _cached: true
                });
            }
        }

        console.log(`DEBUG: Fetching fresh stats for Zone ${zoneId}`);

        // 1. Get franchise details from MAIN database (franchise_requests table is there)
        const franchiseResult: any = await executeMainQuery({
            query: `SELECT plan_selected FROM franchise_requests WHERE zone_id = ? AND status = 'approved' LIMIT 1`,
            values: [zoneId],
        });

        const franchisePlan = franchiseResult[0]?.plan_selected || 'free';
        const commissionRate = COMMISSION_RATES[franchisePlan] || COMMISSION_RATES['free'];

        // 2. Query admin commission from order_transactions (commission is stored there, not in orders table)
        const revenueResult: any = await executeQuery({
            query: `
                SELECT 
                    SUM(ot.admin_commission) as totalAdminCommission, 
                    COUNT(DISTINCT o.id) as deliveredOrders 
                FROM orders o
                INNER JOIN order_transactions ot ON o.id = ot.order_id
                WHERE o.zone_id = ? AND o.order_status = 'delivered'
            `,
            values: [zoneId],
        });

        const totalAdminCommission = parseFloat(revenueResult[0]?.totalAdminCommission || 0);
        const deliveredOrders = parseInt(revenueResult[0]?.deliveredOrders || 0);

        // 3. Calculate franchise share from admin commission
        const sharePercent = commissionRate * 100;
        const platformCharges = deliveredOrders * PLATFORM_CHARGE_PER_ORDER;
        const franchiseShare = (totalAdminCommission * sharePercent) / 100;
        const netRevenue = franchiseShare - platformCharges;

        // 4. Active Orders: Count of orders not in final states
        const activeOrdersResult: any = await executeQuery({
            query: `SELECT COUNT(*) as activeOrders FROM orders WHERE zone_id = ? AND order_status NOT IN ('delivered', 'canceled', 'failed', 'refunded')`,
            values: [zoneId],
        });

        // 5. Today's Payout: Franchise share of today's admin commission
        const today = new Date().toISOString().split('T')[0];
        const todaysResult: any = await executeQuery({
            query: `
                SELECT 
                    SUM(ot.admin_commission) as todaysAdminCommission, 
                    COUNT(DISTINCT o.id) as ordersToday 
                FROM orders o
                INNER JOIN order_transactions ot ON o.id = ot.order_id
                WHERE ot.zone_id = ? AND o.order_status = 'delivered' AND DATE(o.created_at) = ?
            `,
            values: [zoneId, today],
        });

        const todaysAdminCommission = parseFloat(todaysResult[0]?.todaysAdminCommission || 0);
        const ordersToday = parseInt(todaysResult[0]?.ordersToday || 0);
        const todaysFranchiseShare = (todaysAdminCommission * sharePercent) / 100;
        const todaysPlatformCharges = ordersToday * PLATFORM_CHARGE_PER_ORDER;
        const todaysPayout = todaysFranchiseShare - todaysPlatformCharges;

        const activeOrders = activeOrdersResult[0]?.activeOrders || 0;

        const responseData = {
            totalRevenue: Math.max(0, netRevenue),
            deliveredOrders,
            todaysPayout: Math.max(0, todaysPayout),
            breakdown: {
                totalAdminCommission,
                sharePercent: `${sharePercent}%`,
                franchiseShare,
                platformCharges,
                deliveredOrders,
                plan: franchisePlan
            }
        };

        // Cache the response
        apiCache.set(cacheKey, responseData);

        return NextResponse.json({
            ...responseData,
            _cached: false
        });
    } catch (error) {
        console.error('Stats calculation error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Optional: Add a DELETE endpoint to manually invalidate cache for a specific zone
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get('zoneId');

    if (zoneId) {
        apiCache.invalidate(`franchise_stats_${zoneId}`);
        return NextResponse.json({ message: `Cache invalidated for zone ${zoneId}` });
    }

    return NextResponse.json({ error: 'Zone ID is required' }, { status: 400 });
}
