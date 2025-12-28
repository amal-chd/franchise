import { NextResponse } from 'next/server';
import executeFranchiseQuery from '@/lib/franchise_db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get('zoneId');

    try {
        if (zoneId) {
            return await getZoneDetail(zoneId);
        } else {
            return await getAllZonesSummary();
        }
    } catch (error: any) {
        console.error('Zone Reports Top-Level Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}

async function getAllZonesSummary() {
    // 1. Get All Zones (Critical)
    let zones: any = [];
    try {
        zones = await executeFranchiseQuery({
            query: 'SELECT id, name FROM zones WHERE status = 1',
            values: []
        });

        if (!Array.isArray(zones)) {
            console.error('Zones fetch returned invalid type:', zones);
            // Fallback: try fetching without status filter if it fails
            zones = await executeFranchiseQuery({
                query: 'SELECT id, name FROM zones',
                values: []
            });
            if (!Array.isArray(zones)) {
                return NextResponse.json({ error: 'Failed to fetch zones' }, { status: 500 });
            }
        }
    } catch (e) {
        console.error('Zones Query Failed:', e);
        return NextResponse.json({ error: 'Database Connection Failed' }, { status: 500 });
    }

    // Helper for safe stats fetching
    const fetchSafeOptions = async (query: string) => {
        try {
            const res: any = await executeFranchiseQuery({ query, values: [] });
            return Array.isArray(res) ? res : [];
        } catch (e) {
            console.error('Stats Query Failed:', query, e);
            return [];
        }
    };

    // 2. Aggregate Queries (Safe)
    const ordersStats = await fetchSafeOptions(`
        SELECT zone_id, COUNT(*) as order_count, SUM(order_amount) as revenue 
        FROM orders 
        GROUP BY zone_id
    `);

    const storeStats = await fetchSafeOptions(`
        SELECT zone_id, COUNT(*) as total_stores 
        FROM stores 
        WHERE status = 'active' OR status = 1 
        GROUP BY zone_id
    `);

    const dmStats = await fetchSafeOptions(`
        SELECT zone_id, COUNT(*) as total_dm 
        FROM delivery_men 
        WHERE status = 1 OR active = 1 
        GROUP BY zone_id
    `);

    // Merge Data
    const summary = zones.map((zone: any) => {
        const orderStat = ordersStats.find((s: any) => s.zone_id === zone.id);
        const storeStat = storeStats.find((s: any) => s.zone_id === zone.id);
        const dmStat = dmStats.find((s: any) => s.zone_id === zone.id);

        return {
            id: zone.id,
            name: zone.name,
            orders_count: orderStat?.order_count || 0,
            revenue: orderStat?.revenue || 0,
            stores_count: storeStat?.total_stores || 0,
            delivery_men_count: dmStat?.total_dm || 0,
        };
    });

    const totalOrders = summary.reduce((sum: number, z: any) => sum + z.orders_count, 0);
    const totalRevenue = summary.reduce((sum: number, z: any) => sum + Number(z.revenue || 0), 0);

    return NextResponse.json({
        total_orders: totalOrders,
        total_revenue: totalRevenue,
        zones: summary
    });
}

async function getZoneDetail(zoneId: string) {
    try {
        const zoneRes: any = await executeFranchiseQuery({
            query: 'SELECT id, name FROM zones WHERE id = ?',
            values: [zoneId]
        });
        const zone = Array.isArray(zoneRes) && zoneRes.length > 0 ? zoneRes[0] : null;

        if (!zone) {
            return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
        }

        const safeQuery = async (query: string, params: any[]) => {
            try {
                const res: any = await executeFranchiseQuery({ query, values: params });
                return Array.isArray(res) ? res : [];
            } catch (e) {
                console.error('Detail Query Failed:', query, e);
                return [];
            }
        };

        const statsRes = await safeQuery(`
            SELECT 
                (SELECT COUNT(*) FROM orders WHERE zone_id = ?) as total_orders,
                (SELECT COALESCE(SUM(order_amount), 0) FROM orders WHERE zone_id = ?) as total_revenue,
                (SELECT COUNT(*) FROM stores WHERE zone_id = ?) as total_stores,
                (SELECT COUNT(*) FROM delivery_men WHERE zone_id = ?) as total_dm
        `, [zoneId, zoneId, zoneId, zoneId]);

        const stats = statsRes.length > 0 ? statsRes[0] : {};

        const moduleStats = await safeQuery(`
            SELECT m.module_name, COUNT(s.id) as store_count
            FROM stores s
            JOIN modules m ON s.module_id = m.id
            WHERE s.zone_id = ?
            GROUP BY m.module_name
        `, [zoneId]);

        const stores = await safeQuery(`
            SELECT s.id, s.name, s.email, s.phone, s.status, s.rating, m.module_name
            FROM stores s
            LEFT JOIN modules m ON s.module_id = m.id
            WHERE s.zone_id = ?
            LIMIT 50
        `, [zoneId]);

        const deliveryMen = await safeQuery(`
            SELECT id, f_name, l_name, email, phone, status, active
            FROM delivery_men
            WHERE zone_id = ?
            LIMIT 50
        `, [zoneId]);

        const recentOrders = await safeQuery(`
            SELECT id, order_amount, order_status, created_at, payment_status
            FROM orders
            WHERE zone_id = ?
            ORDER BY created_at DESC
            LIMIT 20
        `, [zoneId]);

        return NextResponse.json({
            zone,
            stats,
            module_breakdown: moduleStats,
            stores_details: stores,
            delivery_men_details: deliveryMen,
            recent_orders: recentOrders
        });

    } catch (e: any) {
        console.error('Zone Detail Error:', e);
        return NextResponse.json({ error: 'Failed to Fetch Details' }, { status: 500 });
    }
}
