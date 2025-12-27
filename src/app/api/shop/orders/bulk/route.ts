import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

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
                        // Get current status for history
                        const currentOrder: any = await executeQuery({
                            query: 'SELECT status FROM orders WHERE id = ?',
                            values: [orderId]
                        });

                        if (currentOrder.length > 0) {
                            // Update status
                            await executeQuery({
                                query: 'UPDATE orders SET status = ? WHERE id = ?',
                                values: [data.status, orderId]
                            });

                            // Record in history
                            await executeQuery({
                                query: 'INSERT INTO order_history (order_id, status_from, status_to, changed_by, notes) VALUES (?, ?, ?, ?, ?)',
                                values: [
                                    orderId,
                                    currentOrder[0].status,
                                    data.status,
                                    data.changedBy || null,
                                    data.notes || `Bulk status update to ${data.status}`
                                ]
                            });

                            successCount++;
                        } else {
                            failedIds.push(orderId);
                        }
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

                for (const orderId of orderIds) {
                    try {
                        await executeQuery({
                            query: 'UPDATE orders SET payment_status = ? WHERE id = ?',
                            values: [data.paymentStatus, orderId]
                        });
                        successCount++;
                    } catch (error: any) {
                        failedIds.push(orderId);
                    }
                }
                break;

            case 'delete':
                // Soft delete by updating status to 'cancelled'
                for (const orderId of orderIds) {
                    try {
                        await executeQuery({
                            query: 'UPDATE orders SET status = ? WHERE id = ?',
                            values: ['cancelled', orderId]
                        });

                        await executeQuery({
                            query: 'INSERT INTO order_history (order_id, status_to, notes) VALUES (?, ?, ?)',
                            values: [orderId, 'cancelled', 'Bulk cancelled']
                        });

                        successCount++;
                    } catch (error: any) {
                        failedIds.push(orderId);
                    }
                }
                break;

            case 'export':
                // Export orders to CSV
                try {
                    const placeholders = orderIds.map(() => '?').join(',');
                    const orders: any = await executeQuery({
                        query: `
                            SELECT 
                                o.id,
                                o.franchise_id,
                                f.name as franchise_name,
                                f.city as zone_name,
                                o.total_amount,
                                o.status,
                                o.payment_status,
                                o.razorpay_order_id,
                                o.created_at
                            FROM orders o
                            LEFT JOIN franchise_requests f ON o.franchise_id = f.id
                            WHERE o.id IN (${placeholders})
                        `,
                        values: orderIds
                    });

                    // Convert to CSV format
                    const headers = ['Order ID', 'Franchise', 'Zone', 'Amount', 'Status', 'Payment', 'Razorpay ID', 'Created'];
                    const csvData = [
                        headers.join(','),
                        ...orders.map((order: any) => [
                            order.id,
                            order.franchise_name || '',
                            order.zone_name || '',
                            order.total_amount,
                            order.status,
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
