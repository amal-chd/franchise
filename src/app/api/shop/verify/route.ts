import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { firestore } from '@/lib/firebase';

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
            // Update order status in Firestore
            await firestore.collection('orders').doc(orderId).update({
                payment_status: 'paid',
                order_status: 'processing',
                razorpay_payment_id: razorpay_payment_id,
                updated_at: new Date()
            });

            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('Verify error:', error);
        return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 500 });
    }
}
