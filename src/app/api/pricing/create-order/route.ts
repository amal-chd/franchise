import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import executeQuery from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { requestId, plan } = body;

        if (!requestId || !plan) {
            return NextResponse.json({ message: 'Request ID and plan are required' }, { status: 400 });
        }

        // Plan pricing mapping
        const planPricing: { [key: string]: number } = {
            'free': 0,
            'basic': 500000, // ₹5000 in paise
            'premium': 1000000, // ₹10000 in paise
        };

        const amount = planPricing[plan];

        if (amount === undefined) {
            return NextResponse.json({ message: 'Invalid plan selected' }, { status: 400 });
        }

        // If free plan, skip payment
        if (amount === 0) {
            await executeQuery({
                query: 'UPDATE franchise_requests SET pricing_plan = ?, payment_status = ? WHERE id = ?',
                values: [plan, 'completed', requestId],
            });

            return NextResponse.json({
                message: 'Free plan selected',
                isFree: true,
            }, { status: 200 });
        }

        // Create Razorpay instance
        const razorpay = new Razorpay({
            key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
            key_secret: process.env.RAZORPAY_KEY_SECRET || '',
        });

        // Create order
        const order = await razorpay.orders.create({
            amount: amount,
            currency: 'INR',
            receipt: `receipt_${requestId}_${Date.now()}`,
        });

        // Update database with order details
        await executeQuery({
            query: 'UPDATE franchise_requests SET pricing_plan = ?, razorpay_order_id = ?, payment_status = ? WHERE id = ?',
            values: [plan, order.id, 'pending', requestId],
        });

        return NextResponse.json({
            orderId: order.id,
            amount: amount,
            currency: 'INR',
            keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        }, { status: 200 });

    } catch (error: any) {
        console.error('Create Order Error:', error);
        return NextResponse.json({ message: 'Failed to create order', error: error.message }, { status: 500 });
    }
}
