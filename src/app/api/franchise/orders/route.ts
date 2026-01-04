import { NextResponse } from 'next/server';
import executeFranchiseQuery from '@/lib/franchise_db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get('zoneId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const status = searchParams.get('status');

    if (!zoneId) {
        return NextResponse.json({ error: 'Zone ID is required' }, { status: 400 });
    }

    try {
        // Build dynamic query with filters
        const conditions = ['o.zone_id = ?'];
        const values: any[] = [zoneId];

        if (dateFrom) {
            conditions.push('DATE(o.created_at) >= ?');
            values.push(dateFrom);
        }

        if (dateTo) {
            conditions.push('DATE(o.created_at) <= ?');
            values.push(dateTo);
        }

        if (status && status !== 'all') {
            conditions.push('o.order_status = ?');
            values.push(status);
        }

        const whereClause = conditions.join(' AND ');

        // Fetch orders for the given zone from READ-ONLY Franchise DB
        const query = `
            SELECT 
                o.id, 
                o.user_id,
                CONCAT_WS(' ', u.f_name, u.l_name) as user_name,
                u.phone as user_phone,
                o.delivery_address,
                o.order_amount, 
                o.order_status, 
                o.payment_status, 
                o.payment_method, 
                o.created_at, 
                o.zone_id, 
                o.store_id 
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            WHERE ${whereClause}
            ORDER BY o.created_at DESC 
            LIMIT 100
        `;

        const dbResult: any = await executeFranchiseQuery({
            query,
            values,
        });

        if (dbResult.error) {
            console.error('Orders query error:', dbResult.error);
            return NextResponse.json([]); // Return empty list on error
        }

        const orders = Array.isArray(dbResult) ? dbResult.map((order: any) => {
            // Parse delivery address if it's JSON
            if (order.delivery_address) {
                try {
                    const addr = JSON.parse(order.delivery_address);
                    if (addr && addr.address) {
                        order.delivery_address = addr.address;
                    }
                } catch (e) {
                    // Not JSON, keep as is
                }
            }
            return order;
        }) : [];

        return NextResponse.json(orders);
    } catch (error: any) {
        console.error('Franchise orders fetch error:', error);
        return NextResponse.json([]); // Return empty list on error
    }
}
