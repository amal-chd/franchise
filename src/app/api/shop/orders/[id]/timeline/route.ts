import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

// Get order timeline/history
export async function GET(request: Request, { params }: { params: { id: string } }) {
    const orderId = params.id;

    if (!orderId) {
        return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    try {
        // Get order details
        const orderResult: any = await executeQuery({
            query: `
                SELECT 
                    o.*,
                    f.name as franchise_name,
                    f.city as zone_name
                FROM orders o
                LEFT JOIN franchise_requests f ON o.franchise_id = f.id
                WHERE o.id = ?
            `,
            values: [orderId]
        });

        if (orderResult.length === 0) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const order = orderResult[0];

        // Get order items
        const items: any = await executeQuery({
            query: `
                SELECT 
                    oi.*,
                    p.name as product_name,
                    p.image_url
                FROM order_items oi
                LEFT JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?
            `,
            values: [orderId]
        });

        // Get order history/timeline
        const history: any = await executeQuery({
            query: `
                SELECT 
                    oh.*,
                    COALESCE(a.email, 'System') as changed_by_name
                FROM order_history oh
                LEFT JOIN admin_users a ON oh.changed_by = a.id
                WHERE oh.order_id = ?
                ORDER BY oh.changed_at ASC
            `,
            values: [orderId]
        });

        return NextResponse.json({
            order,
            items,
            timeline: history
        });

    } catch (error) {
        console.error('Order timeline error:', error);
        return NextResponse.json({ error: 'Failed to fetch order timeline' }, { status: 500 });
    }
}
