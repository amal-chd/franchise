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

        // Fetch pricing from database
        const settingsRows = await executeQuery({
            query: 'SELECT * FROM site_settings WHERE setting_key IN (?, ?, ?, ?)',
            values: ['pricing_basic_price', 'pricing_premium_price', 'pricing_free_price', 'pricing_elite_price']

        });

        const settings = (settingsRows as any[]).reduce((acc, row) => {
            acc[row.setting_key] = row.setting_value;
            return acc;
        }, {});

        // Plan pricing mapping (in paise)
        const planPricing: { [key: string]: number } = {
            'free': 0,
            'basic': (parseInt(settings.pricing_basic_price) || 499) * 100,
            'premium': (parseInt(settings.pricing_premium_price) || 999) * 100,
            'elite': (parseInt(settings.pricing_elite_price) || 2499) * 100,

        };

        const amount = planPricing[plan];

        if (amount === undefined) {
            return NextResponse.json({ message: 'Invalid plan selected' }, { status: 400 });
        }

        // Check if amount is 0 (true free plan)
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
        // Receipt id must be <= 40 chars
        const shortId = requestId.slice(-8);
        const receiptId = `rcpt_${shortId}_${Date.now().toString().slice(-6)}`;

        const order = await razorpay.orders.create({
            amount: amount,
            currency: 'INR',
            receipt: receiptId,
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
