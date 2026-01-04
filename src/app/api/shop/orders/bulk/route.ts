import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Bulk operations for orders
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, orderIds, data } = body;

        if (!action || !orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            return NextResponse.json({ error: 'Invalid bulk operation data' }, { status: 400 });
        }

        let successCount = 0;
        let failedIds: number[] = [];

        switch (action) {
            case 'update_status':
                if (!data?.status) {
                    return NextResponse.json({ error: 'Status is required for update_status action' }, { status: 400 });
                }

                for (const orderId of orderIds) {
                    try {
                        // Get current status (Read can be public/anon)
                        const { data: currentOrder, error: fetchError } = await supabase
                            .from('orders')
                            .select('order_status')
                            .eq('id', orderId)
                            .single();

                        if (fetchError || !currentOrder) {
                            failedIds.push(orderId);
                            continue;
                        }

                        // Update with Admin
                        const { error: updateError } = await supabaseAdmin
                            .from('orders')
                            .update({ order_status: data.status })
                            .eq('id', orderId);

                        if (updateError) throw updateError;

                        // History with Admin
                        await supabaseAdmin.from('order_history').insert({
                            order_id: orderId,
                            status_from: currentOrder.order_status,
                            status_to: data.status,
                            changed_by: data.changedBy || null,
                            notes: data.notes || `Bulk status update to ${data.status}`
                        });

                        successCount++;
                    } catch (error: any) {
                        console.error(`Failed to update order ${orderId}:`, error);
                        failedIds.push(orderId);
                    }
                }
                break;

            case 'update_payment':
                if (!data?.paymentStatus) {
                    return NextResponse.json({ error: 'Payment status is required' }, { status: 400 });
                }

                const { error: paymentError } = await supabaseAdmin
                    .from('orders')
                    .update({ payment_status: data.paymentStatus })
                    .in('id', orderIds);

                if (paymentError) {
                    console.error('Bulk payment update error:', paymentError);
                    failedIds = orderIds; // All failed
                } else {
                    successCount = orderIds.length;
                }
                break;

            case 'delete':
                // Soft delete by updating status to 'cancelled'
                for (const orderId of orderIds) {
                    try {
                        const { error: updateError } = await supabaseAdmin
                            .from('orders')
                            .update({ order_status: 'cancelled' })
                            .eq('id', orderId);

                        if (updateError) throw updateError;

                        await supabaseAdmin.from('order_history').insert({
                            order_id: orderId,
                            status_to: 'cancelled',
                            notes: 'Bulk cancelled'
                        });

                        successCount++;
                    } catch (error: any) {
                        failedIds.push(orderId);
                    }
                }
                break;

            case 'export':
                // Export orders to CSV (Read is fine with anon if policies correct, else use Admin if admin dashboard)
                try {
                    const { data: orders, error: exportError } = await supabaseAdmin
                        .from('orders') // use Admin for export just to be safe they can see everything
                        .select('*, franchise_requests(name, city)')
                        .in('id', orderIds);

                    if (exportError) throw exportError;

                    // Convert to CSV format
                    const headers = ['Order ID', 'Franchise', 'Zone', 'Amount', 'Status', 'Payment', 'Razorpay ID', 'Created'];
                    const csvData = [
                        headers.join(','),
                        ...(orders || []).map((order: any) => [
                            order.id,
                            order.franchise_requests?.name || '',
                            order.franchise_requests?.city || '',
                            order.order_amount,
                            order.order_status,
                            order.payment_status,
                            order.razorpay_order_id || '',
                            order.created_at
                        ].join(','))
                    ].join('\n');

                    return NextResponse.json({
                        success: true,
                        csvData,
                        filename: `orders_export_${Date.now()}.csv`
                    });
                } catch (error: any) {
                    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
                }

            default:
                return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            successCount,
            failedCount: failedIds.length,
            failedIds,
            message: `Successfully processed ${successCount} out of ${orderIds.length} orders`
        });

    } catch (error: any) {
        console.error('Bulk operation error:', error);
        return NextResponse.json({ error: 'Bulk operation failed' }, { status: 500 });
    }
}
