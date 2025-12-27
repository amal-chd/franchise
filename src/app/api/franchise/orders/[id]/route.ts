import { NextResponse } from 'next/server';
import executeFranchiseQuery from '@/lib/franchise_db';

export async function GET(
    request: Request,
    { params }: { params: any }
) {
    const { id: orderId } = await params;

    if (!orderId || orderId === 'undefined' || orderId === 'null') {
        return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    try {
        // Fetch order details
        const orderQuery = `
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
            WHERE o.id = ?
        `;

        const result: any = await executeFranchiseQuery({
            query: orderQuery,
            values: [orderId],
        });

        if (result.error) {
            console.error('Order query error:', result.error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        if (!Array.isArray(result) || result.length === 0) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const order = result[0];

        // Parse delivery address if it's JSON
        if (order.delivery_address) {
            try {
                const addr = JSON.parse(order.delivery_address);
                if (addr && addr.address) {
                    order.delivery_address = addr.address;
                }
            } catch (e) {
                // Not JSON or missing address field, keep as is
            }
        }

        // Fetch order items with product/food details
        const itemsQuery = `
            SELECT 
                oi.id,
                oi.item_id,
                oi.quantity,
                oi.price,
                oi.item_details,
                i.name as db_item_name
            FROM order_details oi
            LEFT JOIN items i ON oi.item_id = i.id
            WHERE oi.order_id = ?
        `;

        const resultItems: any = await executeFranchiseQuery({
            query: itemsQuery,
            values: [orderId],
        });

        const rawItems = Array.isArray(resultItems) ? resultItems : [];
        const items = rawItems.map((item: any) => {
            let itemName = item.db_item_name || 'Unknown Item';

            // Try to extract name from item_details JSON if available
            if (item.item_details) {
                try {
                    const details = JSON.parse(item.item_details);
                    if (details && details.name) {
                        itemName = details.name;
                    }
                } catch (e) {
                    // Not JSON, keep db_item_name
                }
            }

            return {
                ...item,
                item_name: itemName
            };
        });

        // Return order with items
        return NextResponse.json({
            ...order,
            items: items
        });
    } catch (error) {
        console.error('Order details fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch order details' }, { status: 500 });
    }
}
