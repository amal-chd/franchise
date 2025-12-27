import { NextResponse } from 'next/server';
import executeFranchiseQuery from '@/lib/franchise_db';
import executeQuery from '@/lib/db';

// Get franchise leaderboard with monthly rankings
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // Format: YYYY-MM
    const limit = parseInt(searchParams.get('limit') || '10');

    try {
        // Default to current month if not specified
        const targetMonth = month || new Date().toISOString().slice(0, 7);
        const [year, monthNum] = targetMonth.split('-');

        // 1. Get leaderboard base data from Franchise DB (Orders + Zones)
        const leaderboardQuery = `
            SELECT 
                o.zone_id,
                z.name as zone_name,
                COUNT(DISTINCT o.id) as total_orders,
                COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.id END) as completed_orders,
                SUM(CASE WHEN o.order_status = 'delivered' THEN o.order_amount ELSE 0 END) as total_revenue,
                AVG(CASE WHEN o.order_status = 'delivered' THEN o.order_amount END) as avg_order_value
            FROM orders o
            JOIN zones z ON o.zone_id = z.id
            WHERE YEAR(o.created_at) = ? 
            AND MONTH(o.created_at) = ?
            GROUP BY o.zone_id, z.name
            HAVING total_orders > 0
            ORDER BY total_orders DESC
            LIMIT ?
        `;

        const leaderboardResults: any = await executeFranchiseQuery({
            query: leaderboardQuery,
            values: [year, monthNum, limit]
        });

        if (leaderboardResults.error) {
            console.error('Leaderboard DB Error:', leaderboardResults.error);
            throw new Error('Database Error');
        }

        // 2. Get franchise names from Main DB
        const franchises: any = await executeQuery({
            query: "SELECT name, city FROM franchise_requests WHERE status = 'approved'",
            values: []
        });

        // 3. Map franchise names to leaderboard results
        // We match by city/zone name
        const rankedLeaderboard = leaderboardResults.map((entry: any, index: number) => {
            const franchise = franchises.find((f: any) =>
                f.city.toLowerCase().trim() === entry.zone_name.toLowerCase().trim()
            );

            return {
                ...entry,
                rank: index + 1,
                franchise_name: franchise ? franchise.name : 'The Kada Partner',
                total_revenue: parseFloat(entry.total_revenue || 0),
                avg_order_value: parseFloat(entry.avg_order_value || 0)
            };
        });

        // 4. Get historical data for the last 6 months
        const historicalQuery = `
            SELECT 
                DATE_FORMAT(o.created_at, '%Y-%m') as month,
                z.name as zone_name,
                COUNT(DISTINCT o.id) as orders_count
            FROM orders o
            JOIN zones z ON o.zone_id = z.id
            WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(o.created_at, '%Y-%m'), z.name
            ORDER BY month DESC, orders_count DESC
        `;

        const historical: any = await executeFranchiseQuery({
            query: historicalQuery,
            values: []
        });

        const historicalByMonth: { [key: string]: any[] } = {};
        if (Array.isArray(historical)) {
            historical.forEach((entry: any) => {
                if (!historicalByMonth[entry.month]) {
                    historicalByMonth[entry.month] = [];
                }
                historicalByMonth[entry.month].push({
                    zone_name: entry.zone_name,
                    orders_count: entry.orders_count
                });
            });
        }

        // 5. Get overall statistics
        const statsQuery = `
            SELECT 
                COUNT(DISTINCT zone_id) as active_zones,
                COUNT(*) as total_orders_this_month
            FROM orders
            WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?
        `;

        const stats: any = await executeFranchiseQuery({
            query: statsQuery,
            values: [year, monthNum]
        });

        return NextResponse.json({
            month: targetMonth,
            leaderboard: rankedLeaderboard,
            historical: historicalByMonth,
            stats: {
                activeZones: stats[0]?.active_zones || 0,
                totalOrders: stats[0]?.total_orders_this_month || 0
            }
        });

    } catch (error) {
        console.error('Leaderboard fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }
}
