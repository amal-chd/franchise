import { NextResponse, NextRequest } from 'next/server';
import { firestore } from '@/lib/firebase';

// Get order timeline/history
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id: orderId } = await params;

    if (!orderId) {
        return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    try {
        // 1. Get Order Details
        const orderDoc = await firestore.collection('orders').doc(orderId).get();

        if (!orderDoc.exists) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const order = orderDoc.data();

        let franchise_name = 'Unknown';
        let zone_name = 'Unknown';

        if (order?.franchise_id) {
            const fDoc = await firestore.collection('franchise_requests').doc(order.franchise_id).get();
            if (fDoc.exists) {
                franchise_name = fDoc.data()?.name || 'Unknown';
                zone_name = fDoc.data()?.city || 'Unknown';
            }
        }

        // Flatten franchise details for frontend consistency
        const orderData = {
            id: orderDoc.id,
            ...order,
            franchise_name,
            zone_name,
            created_at: order?.created_at?.toDate ? order.created_at.toDate() : order?.created_at
        };

        // 2. Get Order Items (Stored in 'items' array in order doc now, or separate if migrated differently)
        // In previous POST refactor, I put them in 'items' field of order doc.
        // But if we want to be safe, we check if 'items' exists, else try to fetch subcollection if we decided to use that?
        // I'll assume 'items' array in doc as per my POST implementation match.

        const items = (order?.items || []).map((item: any) => ({
            ...item,
            // If products were joined, we might need name/image. 
            // Ideally we store snapshot of name/image in order item at purchase time.
            // If not, we might need to fetch product details (N+1).
            // Assuming basic details `name`, `image_url` might be needed from `products` collection if not in item.
            // POST implementations usually include price/qty.
        }));

        // Enrich items with product details if needed (optional optimization: parallel fetch)
        const enrichedItems = await Promise.all(items.map(async (item: any) => {
            if (item.product_id) {
                const pDoc = await firestore.collection('products').doc(item.product_id).get();
                const pData = pDoc.data();
                return { ...item, product_name: pData?.name || 'Unknown', image_url: pData?.image_url };
            }
            return item;
        }));


        // 3. Get Order History (Subcollection 'history')
        const historySnapshot = await firestore.collection('orders').doc(orderId).collection('history')
            .orderBy('created_at', 'asc')
            .get();

        const historyData = historySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            created_at: doc.data().created_at?.toDate ? doc.data().created_at.toDate() : doc.data().created_at,
            changed_by_name: doc.data().changed_by || 'System'
        }));

        return NextResponse.json({
            order: orderData,
            items: enrichedItems,
            timeline: historyData
        });

    } catch (error: any) {
        console.error('Order timeline error:', error);
        return NextResponse.json({ error: 'Failed to fetch order timeline', details: error.message }, { status: 500 });
    }
}
