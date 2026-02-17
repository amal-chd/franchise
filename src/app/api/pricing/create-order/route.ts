import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { firestore } from '@/lib/firebase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { requestId, plan } = body;

        if (!requestId || !plan) {
            return NextResponse.json({ message: 'Request ID and plan are required' }, { status: 400 });
        }

        // Fetch pricing from Firestore site_settings
        // Assuming site_settings logic: document ID 'pricing' or separate docs for keys
        // Based on previous CMS/Settings refactor, they are in 'site_settings' with 'content_key' or similar if unified,
        // BUT here it looks like specific keys. Let's assume we query 'site_settings' collection 
        // where 'section' might be 'pricing' or key is the doc ID.
        // Let's try to fetch all settings or filter by keys.
        // To be safe and compatible with previous refactor (which used section/key), let's query.

        const settingsSnapshot = await firestore.collection('site_settings').get();
        const settings: any = {};

        settingsSnapshot.forEach((doc: any) => {
            const data = doc.data();
            // Supports both structure: { key: value } or { content_key: value }
            if (data.content_key) {
                settings[data.content_key] = data.content_value;
            } else if (data.setting_key) {
                settings[data.setting_key] = data.setting_value;
            }
        });

        // Plan pricing mapping (in paise)
        const planPricing: { [key: string]: number } = {


            'basic': (Number(settings.pricing_basic_price) || 499) * 100,
            'premium': (Number(settings.pricing_premium_price) || 999) * 100,
            'elite': (Number(settings.pricing_elite_price) || 2499) * 100,
        };

        const amount = planPricing[plan];

        if (amount === undefined) {
            return NextResponse.json({ message: 'Invalid plan selected' }, { status: 400 });
        }

        const requestRef = firestore.collection('franchise_requests').doc(String(requestId));



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

        // Update Firestore with order details
        await requestRef.update({
            pricing_plan: plan,
            razorpay_order_id: order.id,
            payment_status: 'pending'
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

