import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { supabase } from '@/lib/supabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendNotification } from '@/lib/notifications';

// Advanced filtering, pagination, and search for orders
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    // Extract filter parameters
    const franchiseId = searchParams.get('franchiseId');
    const isAdmin = searchParams.get('admin') === 'true';
    const statusFilter = searchParams.get('status')?.split(',') || [];
    const paymentStatusFilter = searchParams.get('paymentStatus')?.split(',') || [];
    let zoneIdParam = searchParams.get('zoneId');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder')?.toUpperCase() === 'ASC' ? false : true; // false = ASC, true = DESC in Supabase

    // Map frontend sort fields to DB columns
    const sortMapping: Record<string, string> = {
        'created_at': 'created_at',
        'total_amount': 'order_amount',
        'status': 'order_status',
        'payment_status': 'payment_status',
        'id': 'id'
    };

    const dbSortBy = sortMapping[sortBy] || 'created_at';

    if (!franchiseId && !isAdmin) {
        return NextResponse.json({ error: 'Franchise ID required' }, { status: 400 });
    }

    try {
        let query = supabase
            .from('orders')
            .select(`
                *,
                order_items (count)
            `, { count: 'exact' });

        if (franchiseId) {
            query = query.eq('franchise_id', franchiseId);
        }

        if (statusFilter.length > 0) {
            query = query.in('order_status', statusFilter);
        }

        if (paymentStatusFilter.length > 0) {
            query = query.in('payment_status', paymentStatusFilter);
        }

        if (zoneIdParam) {
            query = query.eq('zone_id', zoneIdParam);
        }

        if (search) {
            // Check if search is numeric (ID search) or string (maybe unrelated? but here mostly ID)
            if (!isNaN(Number(search))) {
                query = query.eq('id', search);
            }
            // If we had text search on other fields, we'd add it here.
        }

        if (dateFrom) {
            query = query.gte('created_at', dateFrom);
        }

        if (dateTo) {
            query = query.lte('created_at', dateTo + ' 23:59:59');
        }

        // Apply Sorting and Pagination
        query = query.order(dbSortBy, { ascending: !sortOrder }).range(offset, offset + limit - 1);

        const { data: orders, count, error } = await query;

        if (error) throw error;

        const totalOrders = count || 0;
        const totalPages = Math.ceil(totalOrders / limit);

        const ordersList = orders || [];

        // Fetch Franchise Details manually since we don't have FK set up in Typescript definitions clearly or to be safe
        const franchiseIds = [...new Set(ordersList.map((o: any) => o.franchise_id).filter((id: any) => id != null))];
        let franchiseMap: Record<number, any> = {};

        if (franchiseIds.length > 0) {
            const { data: franchises } = await supabase
                .from('franchise_requests')
                .select('id, name, city, zone_id')
                .in('id', franchiseIds);

            if (franchises) {
                franchises.forEach(f => {
                    franchiseMap[f.id] = f;
                });
            }
        }

        const mergedOrders = ordersList.map((o: any) => {
            const f = franchiseMap[o.franchise_id] || {};
            return {
                id: o.id,
                total_amount: o.order_amount,
                status: o.order_status,
                payment_status: o.payment_status,
                created_at: o.created_at,
                zone_id: o.zone_id,
                items_count: o.order_items?.[0]?.count || 0,
                franchise_id: o.franchise_id,
                franchise_name: f.name || 'Unknown',
                zone_name: f.city || 'Unknown',
                items: []
            };
        });


        return NextResponse.json({
            orders: mergedOrders,
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
    } catch (error: any) {
        console.error('Orders fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch orders', details: error.message }, { status: 500 });
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

        // Fetch Zone ID for the franchise
        const { data: franchise } = await supabase.from('franchise_requests').select('zone_id').eq('id', franchiseId).single();
        const zoneId = franchise?.zone_id;

        // 1. Create Order in DB (Initial)
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                franchise_id: franchiseId,
                zone_id: zoneId,
                order_amount: totalAmount,
                order_status: 'pending',
                payment_status: 'pending'
            })
            .select()
            .single();

        if (orderError) throw orderError;
        const orderId = order.id;

        // 2. Insert Items
        const orderItems = items.map((item: any) => ({
            order_id: orderId,
            product_id: item.productId,
            quantity: item.quantity,
            price_at_time: item.price
        }));

        const { error: itemsError } = await supabaseAdmin.from('order_items').insert(orderItems);
        if (itemsError) throw itemsError;

        // 3. Create order history entry
        await supabaseAdmin.from('order_history').insert({
            order_id: orderId,
            status_to: 'pending',
            notes: 'Order created'
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
        await supabaseAdmin
            .from('orders')
            .update({ razorpay_order_id: rzOrder.id })
            .eq('id', orderId);

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
    } catch (error: any) {
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
        const { data: currentOrder, error: fetchError } = await supabase
            .from('orders')
            .select('order_status, payment_status, franchise_id')
            .eq('id', id)
            .single();

        if (fetchError || !currentOrder) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const updates: any = {};

        if (status) {
            updates.order_status = status;

            // Record status change in history
            await supabaseAdmin.from('order_history').insert({
                order_id: id,
                status_from: currentOrder.order_status,
                status_to: status,
                changed_by: changedBy || null,
                notes: notes || `Status changed to ${status}`
            });
        }

        if (paymentStatus) {
            updates.payment_status = paymentStatus;
        }

        const { error: updateError } = await supabaseAdmin
            .from('orders')
            .update(updates)
            .eq('id', id);

        if (updateError) throw updateError;

        // Trigger notification for status change
        if (status) {
            await sendNotification({
                franchiseId: currentOrder.franchise_id,
                title: 'Order Status Updated',
                message: `Order #${id} status changed to ${status}`,
                type: 'order',
                data: { orderId: id, status }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Order update error:', error);
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
}
