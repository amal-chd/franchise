import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';

// Bulk operations for orders
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, orderIds, data } = body;

        if (!action || !orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            return NextResponse.json({ error: 'Invalid bulk operation data' }, { status: 400 });
        }

        let successCount = 0;
        let failedIds: any[] = []; // Allow strings/numbers

        switch (action) {
            case 'update_status':
                if (!data?.status) {
                    return NextResponse.json({ error: 'Status is required for update_status action' }, { status: 400 });
                }

                for (const orderId of orderIds) {
                    try {
                        const orderRef = firestore.collection('orders').doc(orderId);
                        const orderSnapshot = await orderRef.get();

                        if (!orderSnapshot.exists) {
                            failedIds.push(orderId);
                            continue;
                        }

                        const currentStatus = orderSnapshot.data()?.order_status;

                        await orderRef.update({
                            order_status: data.status,
                            updated_at: new Date()
                        });

                        // History
                        await orderRef.collection('history').add({
                            status_from: currentStatus,
                            status_to: data.status,
                            changed_by: data.changedBy || null,
                            notes: data.notes || `Bulk status update to ${data.status}`,
                            created_at: new Date()
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

                // Firestore batch (limit 500)
                const batch = firestore.batch();
                // If > 500, need to chunk. Assuming < 500 for now or user is aware of limits.

                for (const orderId of orderIds) {
                    const ref = firestore.collection('orders').doc(orderId);
                    batch.update(ref, {
                        payment_status: data.paymentStatus,
                        updated_at: new Date()
                    });
                }

                try {
                    await batch.commit();
                    successCount = orderIds.length;
                } catch (batchError) {
                    console.error('Bulk payment update error:', batchError);
                    failedIds = orderIds;
                }
                break;

            case 'delete':
                // Soft delete by updating status to 'cancelled'
                for (const orderId of orderIds) {
                    try {
                        const orderRef = firestore.collection('orders').doc(orderId);
                        await orderRef.update({
                            order_status: 'cancelled',
                            updated_at: new Date()
                        });

                        await orderRef.collection('history').add({
                            status_to: 'cancelled',
                            notes: 'Bulk cancelled',
                            created_at: new Date()
                        });

                        successCount++;
                    } catch (error: any) {
                        failedIds.push(orderId);
                    }
                }
                break;

            case 'export':
                try {
                    // Fetch orders
                    // max limit for 'in' is 10. If more, we must iterate.
                    // Or just fetch all and filter in memory if not too big, or Promise.all fetches.
                    // Promise.all is robust for list of IDs.

                    const validOrders: any[] = [];

                    await Promise.all(orderIds.map(async (oid: string) => {
                        const doc = await firestore.collection('orders').doc(oid).get();
                        if (doc.exists) {
                            const oData = doc.data();
                            // Fetch franchise name
                            let fName = '';
                            let fCity = '';
                            if (oData?.franchise_id) {
                                const fDoc = await firestore.collection('franchise_requests').doc(oData.franchise_id).get();
                                if (fDoc.exists) {
                                    fName = fDoc.data()?.name || '';
                                    fCity = fDoc.data()?.city || '';
                                }
                            }
                            validOrders.push({
                                id: doc.id,
                                ...oData,
                                franchise_name: fName,
                                franchise_city: fCity,
                                created_at: oData?.created_at?.toDate ? oData.created_at.toDate().toISOString() : oData?.created_at
                            });
                        }
                    }));


                    // Convert to CSV format
                    const headers = ['Order ID', 'Franchise', 'Zone', 'Amount', 'Status', 'Payment', 'Razorpay ID', 'Created'];
                    const csvData = [
                        headers.join(','),
                        ...(validOrders || []).map((order: any) => [
                            order.id,
                            order.franchise_name,
                            order.franchise_city,
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
                    console.error('Export error: ', error);
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
