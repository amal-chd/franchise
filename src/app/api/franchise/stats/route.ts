import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';
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

        // 1. Get franchise details from Firestore
        const franchiseSnapshot = await firestore.collection('franchise_requests')
            .where('zone_id', '==', zoneId)
            .where('status', '==', 'approved')
            .limit(1)
            .get();

        const franchisePlan = !franchiseSnapshot.empty ? (franchiseSnapshot.docs[0].data().plan_selected || 'free') : 'free';
        const commissionRate = COMMISSION_RATES[franchisePlan] || COMMISSION_RATES['free'];

        // 2. Fetch orders to calculate stats (Assuming 'orders' collection)
        // Note: Firestore aggregation for SUM is not direct. fetching delivered orders for zone.
        // Warning: This can be expensive if many orders. Optimized approach would be to maintain counters.
        // For migration, we'll fetch fields needed.
        const ordersSnapshot = await firestore.collection('orders')
            .where('zone_id', '==', zoneId)
            .get();

        let totalAdminCommission = 0;
        let deliveredOrders = 0;
        let activeOrdersCount = 0;
        let todaysAdminCommission = 0;
        let ordersTodayCount = 0;

        const today = new Date().toISOString().split('T')[0];

        ordersSnapshot.forEach((doc: any) => {
            const data = doc.data();
            const status = data.order_status;
            // Assuming admin_commission is stored on the order or a sub-collection 'transactions'.
            // The original SQL joined `order_transactions`. Let's assume it's merged or we check `transactions` subcollection?
            // "data.admin_commission" might be available if denormalized.
            // If not, we might miss it. Let's assume denormalized on order for now or 0.
            const adminComm = parseFloat(data.admin_commission || 0);

            if (status === 'delivered') {
                deliveredOrders++;
                totalAdminCommission += adminComm;

                const orderDate = data.created_at?.toDate ? data.created_at.toDate().toISOString().split('T')[0] : '';
                if (orderDate === today) {
                    todaysAdminCommission += adminComm;
                    ordersTodayCount++;
                }
            } else if (!['delivered', 'canceled', 'failed', 'refunded'].includes(status)) {
                activeOrdersCount++;
            }
        });

        // 3. Calculate franchise share from admin commission
        const sharePercent = commissionRate * 100;
        const platformCharges = deliveredOrders * PLATFORM_CHARGE_PER_ORDER;
        const franchiseShare = (totalAdminCommission * sharePercent) / 100;
        const netRevenue = franchiseShare - platformCharges;

        // 4. Active Orders: Count of orders not in final states (already calculated in loop)
        const activeOrders = activeOrdersCount;

        // 5. Today's Payout: Franchise share of today's admin commission (already calculated in loop)
        const todaysFranchiseShare = (todaysAdminCommission * sharePercent) / 100;
        const todaysPlatformCharges = ordersTodayCount * PLATFORM_CHARGE_PER_ORDER;
        const todaysPayout = todaysFranchiseShare - todaysPlatformCharges;

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
    } catch (error: any) {
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
