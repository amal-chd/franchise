import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

// Get Order History
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const franchiseId = searchParams.get('franchiseId');
    const isAdmin = searchParams.get('admin') === 'true';

    if (!franchiseId && !isAdmin) {
        return NextResponse.json({ error: 'Franchise ID required' }, { status: 400 });
    }

    try {
        let query = 'SELECT * FROM orders';
        const values = [];

        if (franchiseId) {
            query += ' WHERE franchise_id = ?';
            values.push(franchiseId);
        }

        query += ' ORDER BY created_at DESC';

        const orders: any = await executeQuery({
            query,
            values
        });

        // For each order, fetch items (not efficient for bulk, but ok for individual history view)
        // Or do a JOIN. Let's do a JOIN query + aggregation or just return basic order info first.
        // Let's stick to basic order info for list, and maybe separate endpoint or include items.
        // Let's do simple list for now.

        return NextResponse.json(orders);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}

// Create New Order
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { franchiseId, items, totalAmount } = body;
        // items: [{ productId, quantity, price }]

        if (!franchiseId || !items || items.length === 0) {
            return NextResponse.json({ error: 'Invalid order data' }, { status: 400 });
        }

        // 1. Create Order
        const orderResult: any = await executeQuery({
            query: 'INSERT INTO orders (franchise_id, total_amount, status, payment_status) VALUES (?, ?, ?, ?)',
            values: [franchiseId, totalAmount, 'pending', 'pending'] // Payment status should ideally be updated after razorpay success
        });

        const orderId = orderResult.insertId;

        // 2. Insert Items
        for (const item of items) {
            await executeQuery({
                query: 'INSERT INTO order_items (order_id, product_id, quantity, price_at_time) VALUES (?, ?, ?, ?)',
                values: [orderId, item.productId, item.quantity, item.price]
            });
        }

        return NextResponse.json({ success: true, orderId });
    } catch (error) {
        console.error("Order creation failed", error);
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
}
