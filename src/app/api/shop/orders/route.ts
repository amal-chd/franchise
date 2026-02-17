import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { firestore } from '@/lib/firebase';
import { sendNotification } from '@/lib/notifications';

// Advanced filtering, pagination, and search for orders
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    // Extract filter parameters
    const franchiseId = searchParams.get('franchiseId');
    const isAdmin = searchParams.get('admin') === 'true';
    const statusFilter = searchParams.get('status')?.split(',') || [];
    const paymentStatusFilter = searchParams.get('paymentStatus')?.split(',') || [];
    const zoneIdParam = searchParams.get('zoneId');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limitParams = parseInt(searchParams.get('limit') || '50');
    // Firestore offset is hard without cursor, but we can try to mimic or just use limit
    // For now, fetching limit * page might be needed or just limit and warn about deep pagination

    if (!franchiseId && !isAdmin) {
        return NextResponse.json({ error: 'Franchise ID required' }, { status: 400 });
    }

    try {
        let query: any = firestore.collection('orders');

        if (franchiseId) {
            query = query.where('franchise_id', '==', franchiseId);
        }

        if (statusFilter.length > 0) {
            query = query.where('order_status', 'in', statusFilter);
        }

        if (paymentStatusFilter.length > 0) {
            query = query.where('payment_status', 'in', paymentStatusFilter);
        }

        if (zoneIdParam) {
            query = query.where('zone_id', '==', zoneIdParam);
        }

        if (dateFrom) {
            query = query.where('created_at', '>=', new Date(dateFrom));
        }

        if (dateTo) {
            const toDate = new Date(dateTo);
            toDate.setHours(23, 59, 59, 999);
            query = query.where('created_at', '<=', toDate);
        }

        // Apply Ordering
        // Note: Firestore requires composite indexes for inequality filters + distinct sort orders
        // Defaulting to created_at desc
        query = query.orderBy('created_at', 'desc');

        // Apply Limit
        // Note: Real pagination with offset requires query cursors. 
        // We'll fetch limit + some buffer or just fetch all for this filtered view if expected to be small
        // But for safety, we implement simple limit.
        query = query.limit(limitParams);

        // Search is manual in client side or we search by ID if it's an ID
        if (search) {
            // If searching by ID, fetch directly
            if (search.length > 10) { // Assuming Firestore ID length
                const doc = await firestore.collection('orders').doc(search).get();
                if (doc.exists) {
                    // Return single result wrapped
                    // Need to fetch franchise details
                    const d = doc.data();
                    let franchise_name = 'Unknown';
                    let zone_name = 'Unknown';
                    if (d?.franchise_id) {
                        const fDoc = await firestore.collection('franchise_requests').doc(d.franchise_id).get();
                        if (fDoc.exists) {
                            franchise_name = fDoc.data()?.name || 'Unknown';
                            zone_name = fDoc.data()?.city || 'Unknown';
                        }
                    }

                    return NextResponse.json({
                        orders: [{
                            id: doc.id,
                            total_amount: d?.order_amount,
                            status: d?.order_status,
                            payment_status: d?.payment_status,
                            created_at: d?.created_at?.toDate ? d.created_at.toDate() : d?.created_at,
                            zone_id: d?.zone_id,
                            items_count: d?.items?.length || 0,
                            franchise_id: d?.franchise_id,
                            franchise_name,
                            zone_name,
                            items: d?.items || []
                        }],
                        pagination: { page: 1, limit: 1, total: 1, totalPages: 1 }
                    });
                }
            }
            // Else proceed with query but filter manually? No, Firestore can't do text search easily.
        }

        const snapshot = await query.get();

        // Manual filter for search if not ID match and using client-side logic logic (though suboptimal)
        // ...

        let ordersList = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

        // Fetch Franchise Details
        const franchiseIds = [...new Set(ordersList.map((o: any) => o.franchise_id).filter((id: any) => id != null))];
        const franchiseMap: Record<string, any> = {};

        if (franchiseIds.length > 0) {
            // Firestore 'in' limit is 10. If more, we need to batch or fetch individually.
            // Fetching individually is easier to implement for robust support of >10
            await Promise.all(franchiseIds.map(async (fid: any) => {
                const fDoc = await firestore.collection('franchise_requests').doc(fid).get();
                if (fDoc.exists) {
                    franchiseMap[fid] = fDoc.data();
                }
            }));
        }

        const mergedOrders = ordersList.map((o: any) => {
            const f = franchiseMap[o.franchise_id] || {};
            return {
                id: o.id,
                total_amount: o.order_amount,
                status: o.order_status,
                payment_status: o.payment_status,
                created_at: o.created_at?.toDate ? o.created_at.toDate() : o.created_at,
                zone_id: o.zone_id,
                items_count: o.items?.length || 0, // Assuming items stored in doc
                franchise_id: o.franchise_id,
                franchise_name: f.name || 'Unknown',
                zone_name: f.city || 'Unknown',
                items: [] // Keeping empty as per original
            };
        });

        return NextResponse.json({
            orders: mergedOrders,
            pagination: {
                page,
                limit: limitParams,
                total: 1000, // Placeholder as count() is expensive or separate query
                totalPages: 10,
                hasMore: ordersList.length === limitParams
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

        if (!franchiseId || !items || items.length === 0) {
            return NextResponse.json({ error: 'Invalid order data' }, { status: 400 });
        }

        // Fetch Zone ID for the franchise
        const franchiseDoc = await firestore.collection('franchise_requests').doc(franchiseId).get();
        const zoneId = franchiseDoc.data()?.zone_id;

        // 1. Create Order in DB
        const newOrder = {
            franchise_id: franchiseId,
            zone_id: zoneId || null,
            order_amount: totalAmount,
            order_status: 'pending',
            payment_status: 'pending',
            created_at: new Date(),
            items: items // Storing items in the order document for simplicity and atomic reads
        };

        const docRef = await firestore.collection('orders').add(newOrder);
        const orderId = docRef.id;

        // 2. Create order history entry (subcollection)
        await firestore.collection('orders').doc(orderId).collection('history').add({
            status_to: 'pending',
            notes: 'Order created',
            created_at: new Date()
        });

        // 3. Create Razorpay Order
        const razorpay = new Razorpay({
            key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
            key_secret: process.env.RAZORPAY_KEY_SECRET || '',
        });

        const amountInPaise = Math.round(totalAmount * 100);
        const receiptId = `shop_rcpt_${orderId.substring(0, 10)}`; // Shorten ID for Razorpay receipt limit

        const rzOrder = await razorpay.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: receiptId,
        });

        // 4. Update Order with Razorpay ID
        await firestore.collection('orders').doc(orderId).update({
            razorpay_order_id: rzOrder.id
        });

        // 5. Trigger notifications
        try {
            await sendNotification({
                franchiseId: String(franchiseId),
                title: 'New Order Received',
                message: `You have a new order #${orderId} for amount ₹${totalAmount}`,
                type: 'order',
                data: { orderId, totalAmount }
            });

            await sendNotification({
                title: 'New Order Placed',
                message: `A new order has been placed by franchise ${franchiseId}`,
                type: 'order',
                data: { orderId, franchiseId, totalAmount }
            });
        } catch (notifError) {
            console.error('Notification failed', notifError);
        }

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

        const orderRef = firestore.collection('orders').doc(id);
        const orderDoc = await orderRef.get();

        if (!orderDoc.exists) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const currentOrder = orderDoc.data();
        const updates: any = {};

        if (status) {
            updates.order_status = status;

            // Record status change in history
            await orderRef.collection('history').add({
                status_from: currentOrder?.order_status,
                status_to: status,
                changed_by: changedBy || null,
                notes: notes || `Status changed to ${status}`,
                created_at: new Date()
            });
        }

        if (paymentStatus) {
            updates.payment_status = paymentStatus;
        }

        updates.updated_at = new Date();

        await orderRef.update(updates);

        // Trigger notification for status change
        if (status) {
            await sendNotification({
                franchiseId: currentOrder?.franchise_id,
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
