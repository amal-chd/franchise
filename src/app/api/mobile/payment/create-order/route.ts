
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: Request) {
    try {
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
