import { NextResponse } from 'next/server';
import crypto from 'crypto';
import executeQuery from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, requestId } = body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !requestId) {
            return NextResponse.json({ message: 'Missing payment verification details' }, { status: 400 });
        }

        // Verify signature
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return NextResponse.json({ message: 'Payment verification failed' }, { status: 400 });
        }

        // Update database with payment details
        await executeQuery({
            query: 'UPDATE franchise_requests SET razorpay_payment_id = ?, payment_status = ? WHERE id = ?',
            values: [razorpay_payment_id, 'completed', requestId],
        });

        return NextResponse.json({ message: 'Payment verified successfully' }, { status: 200 });

    } catch (error: any) {
        console.error('Payment Verification Error:', error);
        return NextResponse.json({ message: 'Payment verification failed', error: error.message }, { status: 500 });
    }
}
