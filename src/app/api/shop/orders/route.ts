import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import executeQuery from '@/lib/db';
import { sendNotification } from '@/lib/notifications';

// Advanced filtering, pagination, and search for orders
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    // Extract filter parameters
    const franchiseId = searchParams.get('franchiseId');
    const isAdmin = searchParams.get('admin') === 'true';
    const statusFilter = searchParams.get('status')?.split(',') || [];
    const paymentStatusFilter = searchParams.get('paymentStatus')?.split(',') || [];
    const zoneId = searchParams.get('zoneId');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder')?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Validate sortBy to prevent SQL injection
    const allowedSortFields = ['created_at', 'total_amount', 'status', 'payment_status', 'id'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';

    if (!franchiseId && !isAdmin) {
        return NextResponse.json({ error: 'Franchise ID required' }, { status: 400 });
    }

    try {
        // Build dynamic WHERE clause
        const conditions: string[] = [];
        const values: any[] = [];

        if (franchiseId) {
            conditions.push('o.franchise_id = ?');
            values.push(franchiseId);
        }

        if (statusFilter.length > 0) {
            const placeholders = statusFilter.map(() => '?').join(',');
            conditions.push(`o.status IN (${placeholders})`);
            values.push(...statusFilter);
        }

        if (paymentStatusFilter.length > 0) {
            const placeholders = paymentStatusFilter.map(() => '?').join(',');
            conditions.push(`o.payment_status IN (${placeholders})`);
            values.push(...paymentStatusFilter);
        }

        if (zoneId) {
            conditions.push('f.zone_id = ?');
            values.push(zoneId);
        }

        if (search) {
            conditions.push('(o.id LIKE ? OR f.name LIKE ?)');
            const searchPattern = `%${search}%`;
            values.push(searchPattern, searchPattern);
        }

        if (dateFrom) {
            conditions.push('o.created_at >= ?');
            values.push(dateFrom);
        }

        if (dateTo) {
            conditions.push('o.created_at <= ?');
            values.push(dateTo + ' 23:59:59');
        }

        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        // Get total count for pagination
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM orders o
            LEFT JOIN franchise_requests f ON o.franchise_id = f.id
            ${whereClause}
        `;

        const countResult: any = await executeQuery({
            query: countQuery,
            values: values
        });

        const totalOrders = countResult[0].total;
        const totalPages = Math.ceil(totalOrders / limit);

        // Get paginated orders
        const ordersQuery = `
            SELECT 
                o.id,
                o.franchise_id,
                o.total_amount,
                o.status,
                o.payment_status,
                o.created_at,
                f.name as franchise_name,
                f.city as zone_name,
                f.zone_id,
                (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as items_count
            FROM orders o
            LEFT JOIN franchise_requests f ON o.franchise_id = f.id
            ${whereClause}
            ORDER BY o.${safeSortBy} ${sortOrder}
            LIMIT ? OFFSET ?
        `;

        const orders: any = await executeQuery({
            query: ordersQuery,
            values: [...values, limit, offset]
        });

        // Return paginated response with metadata
        return NextResponse.json({
            orders,
            pagination: {
                page,
                limit,
                total: totalOrders,
                totalPages,
                hasMore: page < totalPages
            },
            filters: {
                status: statusFilter,
                paymentStatus: paymentStatusFilter,
                search,
                dateFrom,
                dateTo
            }
        });
    } catch (error) {
        console.error('Orders fetch error:', error);
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

        // 1. Create Order in DB (Initial)
        const orderResult: any = await executeQuery({
            query: 'INSERT INTO orders (franchise_id, total_amount, status, payment_status) VALUES (?, ?, ?, ?)',
            values: [franchiseId, totalAmount, 'pending', 'pending']
        });

        const orderId = orderResult.insertId;

        // 2. Insert Items
        for (const item of items) {
            await executeQuery({
                query: 'INSERT INTO order_items (order_id, product_id, quantity, price_at_time) VALUES (?, ?, ?, ?)',
                values: [orderId, item.productId, item.quantity, item.price]
            });
        }

        // 3. Create order history entry
        await executeQuery({
            query: 'INSERT INTO order_history (order_id, status_to, notes) VALUES (?, ?, ?)',
            values: [orderId, 'pending', 'Order created']
        });

        // 4. Create Razorpay Order
        const razorpay = new Razorpay({
            key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
            key_secret: process.env.RAZORPAY_KEY_SECRET || '',
        });

        const amountInPaise = Math.round(totalAmount * 100);
        const receiptId = `shop_rcpt_${orderId}`;

        const rzOrder = await razorpay.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: receiptId,
        });

        // 5. Update Order with Razorpay ID
        await executeQuery({
            query: 'UPDATE orders SET razorpay_order_id = ? WHERE id = ?',
            values: [rzOrder.id, orderId]
        });

        // 6. Trigger notifications
        // Notify Franchise
        await sendNotification({
            franchiseId: parseInt(franchiseId),
            title: 'New Order Received',
            message: `You have a new order #${orderId} for amount ₹${totalAmount}`,
            type: 'order',
            data: { orderId, totalAmount }
        });

        // Notify Admin
        await sendNotification({
            title: 'New Order Placed',
            message: `A new order #${orderId} has been placed by franchise ${franchiseId}`,
            type: 'order',
            data: { orderId, franchiseId, totalAmount }
        });

        return NextResponse.json({
            success: true,
            orderId,
            razorpayOrderId: rzOrder.id,
            amount: amountInPaise,
            keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error("Order creation failed", error);
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
}

// Update Order Status
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, status, paymentStatus, notes, changedBy } = body;

        if (!id || (!status && !paymentStatus)) {
            return NextResponse.json({ error: 'ID and Status/PaymentStatus required' }, { status: 400 });
        }

        // Get current order details for history
        const currentOrder: any = await executeQuery({
            query: 'SELECT status, payment_status FROM orders WHERE id = ?',
            values: [id]
        });

        if (currentOrder.length === 0) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const updates = [];
        const values = [];

        if (status) {
            updates.push('status = ?');
            values.push(status);

            // Record status change in history
            await executeQuery({
                query: 'INSERT INTO order_history (order_id, status_from, status_to, changed_by, notes) VALUES (?, ?, ?, ?, ?)',
                values: [id, currentOrder[0].status, status, changedBy || null, notes || `Status changed to ${status}`]
            });
        }

        if (paymentStatus) {
            updates.push('payment_status = ?');
            values.push(paymentStatus);
        }

        values.push(id);

        await executeQuery({
            query: `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`,
            values: values
        });

        // Trigger notification for status change
        if (status) {
            // Get franchiseId for this order
            const orderInfo: any = await executeQuery({
                query: 'SELECT franchise_id FROM orders WHERE id = ?',
                values: [id]
            });

            if (orderInfo.length > 0) {
                await sendNotification({
                    franchiseId: orderInfo[0].franchise_id,
                    title: 'Order Status Updated',
                    message: `Order #${id} status changed to ${status}`,
                    type: 'order',
                    data: { orderId: id, status }
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Order update error:', error);
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
}
