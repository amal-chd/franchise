import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(request: Request) {
    try {
        const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        const key_secret = process.env.RAZORPAY_KEY_SECRET;

        if (!key_id || !key_secret) {
            console.error('Razorpay keys are missing');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const razorpay = new Razorpay({
            key_id: key_id,
            key_secret: key_secret,
        });

        const { amount, currency } = await request.json();

        const options = {
            amount: amount, // Amount in paise
            currency: currency || "INR",
            receipt: `upgrade_rcpt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);

        return NextResponse.json(order);
    } catch (error: any) {
        console.error('Razorpay Create Order Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
