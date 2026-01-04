import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Get order timeline/history
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id: orderId } = await params;

    if (!orderId) {
        return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    try {
        // 1. Get Order Details
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*, franchise_requests(name, city)')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Flatten franchise details for frontend consistency
        const orderData = {
            ...order,
            franchise_name: order.franchise_requests?.name || 'Unknown',
            zone_name: order.franchise_requests?.city || 'Unknown'
        };

        // 2. Get Order Items
        const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('*, shop_items(name, image_url)') // Join with shop_items (products)
            .eq('order_id', orderId);

        if (itemsError) throw itemsError;

        const itemsData = items.map((item: any) => ({
            ...item,
            product_name: item.shop_items?.name || 'Unknown',
            image_url: item.shop_items?.image_url || null
        }));

        // 3. Get Order History
        const { data: history, error: historyError } = await supabase
            .from('order_history')
            .select('*')
            .eq('order_id', orderId)
            .order('created_at', { ascending: true }); // Legacy changed_at -> created_at

        if (historyError) throw historyError;

        // Map changed_by to name if possible (omitted complex join for now, just show ID or passed name)
        const historyData = history.map((h: any) => ({
            ...h,
            changed_by_name: h.changed_by || 'System'
        }));

        return NextResponse.json({
            order: orderData,
            items: itemsData,
            timeline: historyData
        });

    } catch (error: any) {
        console.error('Order timeline error:', error);
        return NextResponse.json({ error: 'Failed to fetch order timeline', details: error.message }, { status: 500 });
    }
}
