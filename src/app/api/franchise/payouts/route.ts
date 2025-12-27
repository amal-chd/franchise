import { NextResponse } from 'next/server';
import executeFranchiseQuery from '@/lib/franchise_db';

// Get franchise payouts with date filtering
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get('zoneId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    if (!zoneId) {
        return NextResponse.json({ error: 'Zone ID required' }, { status: 400 });
    }

    try {
        // Build date filter
        let dateFilter = '';
        const values: any[] = [zoneId];

        if (dateFrom && dateTo) {
            dateFilter = 'AND DATE(ot.created_at) BETWEEN ? AND ?';
            values.push(dateFrom, dateTo);
        } else if (dateFrom) {
            dateFilter = 'AND DATE(ot.created_at) >= ?';
            values.push(dateFrom);
        } else if (dateTo) {
            dateFilter = 'AND DATE(ot.created_at) <= ?';
            values.push(dateTo);
        }

        // Calculate total earnings from completed orders
        const earningsQuery = `
            SELECT 
                DATE(ot.created_at) as payout_date,
                COUNT(DISTINCT o.id) as total_orders,
                SUM(ot.store_amount) as restaurant_earnings,
                SUM(ot.delivery_charge) as delivery_earnings,
                SUM(ot.store_amount + ot.delivery_charge) as total_earnings,
                SUM(ot.tax) as total_tax
            FROM orders o
            INNER JOIN order_transactions ot ON o.id = ot.order_id
            WHERE o.zone_id = ?
            AND o.order_status = 'delivered'
            ${dateFilter}
            GROUP BY DATE(ot.created_at)
            ORDER BY payout_date DESC
        `;

        const payouts: any = await executeFranchiseQuery({
            query: earningsQuery,
            values
        });

        // Calculate summary
        const summary = payouts.reduce((acc: any, p: any) => ({
            totalOrders: (acc.totalOrders || 0) + parseInt(p.total_orders),
            totalEarnings: (acc.totalEarnings || 0) + parseFloat(p.total_earnings || 0),
            restaurantEarnings: (acc.restaurantEarnings || 0) + parseFloat(p.restaurant_earnings || 0),
            deliveryEarnings: (acc.deliveryEarnings || 0) + parseFloat(p.delivery_earnings || 0),
            totalTax: (acc.totalTax || 0) + parseFloat(p.total_tax || 0),
        }), {
            totalOrders: 0,
            totalEarnings: 0,
            restaurantEarnings: 0,
            deliveryEarnings: 0,
            totalTax: 0
        });

        // Get pending payouts (today's completed orders)
        const todayPayoutQuery = `
            SELECT 
                COUNT(DISTINCT o.id) as pending_orders,
                SUM(ot.store_amount + ot.delivery_charge) as pending_amount
            FROM orders o
            INNER JOIN order_transactions ot ON o.id = ot.order_id
            WHERE o.zone_id = ?
            AND o.order_status = 'delivered'
            AND DATE(ot.created_at) = CURDATE()
        `;

        const todayPayout: any = await executeFranchiseQuery({
            query: todayPayoutQuery,
            values: [zoneId]
        });

        return NextResponse.json({
            payouts,
            summary,
            todaysPending: {
                orders: todayPayout[0]?.pending_orders || 0,
                amount: parseFloat(todayPayout[0]?.pending_amount || 0)
            }
        });

    } catch (error: any) {
        console.error('Payouts fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 });
    }
}
