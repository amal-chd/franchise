import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { requestId, plan } = body;

        if (!requestId || !plan) {
            return NextResponse.json({ message: 'Request ID and plan are required' }, { status: 400 });
        }

        // Fetch pricing from Supabase site_settings
        const { data: settingsRows, error: settingsError } = await supabase
            .from('site_settings')
            .select('setting_key, setting_value')
            .in('setting_key', ['pricing_basic_price', 'pricing_premium_price', 'pricing_free_price', 'pricing_elite_price']);

        if (settingsError) throw settingsError;

        const settings = (settingsRows || []).reduce((acc: any, row: any) => {
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
            const { error: updateError } = await supabase
                .from('franchise_requests')
                .update({ pricing_plan: plan, payment_status: 'completed' })
                .eq('id', requestId);

            if (updateError) throw updateError;

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
        const shortId = String(requestId).slice(-8);
        const receiptId = `rcpt_${shortId}_${Date.now().toString().slice(-6)}`;

        const order = await razorpay.orders.create({
            amount: amount,
            currency: 'INR',
            receipt: receiptId,
        });

        // Update Supabase with order details
        const { error: updateOrderError } = await supabase
            .from('franchise_requests')
            .update({
                pricing_plan: plan,
                razorpay_order_id: order.id,
                payment_status: 'pending'
            })
            .eq('id', requestId);

        if (updateOrderError) throw updateOrderError;

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

