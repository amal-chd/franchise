import { NextResponse } from 'next/server';
import crypto from 'crypto';
import executeQuery from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = body;

        const secret = process.env.RAZORPAY_KEY_SECRET || '';
        const generated_signature = crypto
            .createHmac('sha256', secret)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (generated_signature === razorpay_signature) {
            // Update order status
            await executeQuery({
                query: 'UPDATE orders SET payment_status = ?, status = ? WHERE id = ?',
                values: ['paid', 'processing', orderId]
            });

            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 400 });
        }
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 500 });
    }
}
