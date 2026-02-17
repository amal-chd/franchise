
import { NextResponse } from 'next/server';
import crypto from 'crypto';

import { firestore } from '@/lib/firebase';

export async function POST(request: Request) {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            franchiseId, // ID from app (int or string) - assume string for Firestore doc if mapped
            oldPlan,
            newPlan,
            amount
        } = await request.json();

        // 1. Verify Signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }

        const fid = String(franchiseId);

        // 2. Log to plan_upgrade_logs (Firestore)
        await firestore.collection('plan_upgrade_logs').add({
            franchise_id: fid,
            old_plan: oldPlan,
            new_plan: newPlan,
            amount: amount / 100, // Convert poise to main currency
            payment_id: razorpay_payment_id,
            order_id: razorpay_order_id,
            created_at: new Date()
        });

        // 3. Update Franchise Request / Profile Plan (Firestore)
        // Updating 'franchise_requests'

        await firestore.collection('franchise_requests').doc(fid).update({
            plan_selected: newPlan,
            pricing_plan: newPlan,
            razorpay_order_id: razorpay_order_id,
            razorpay_payment_id: razorpay_payment_id,
            payment_status: 'completed',
            updated_at: new Date()
        });

        // Also update 'users' or 'profiles' if separate. Assuming merged into franchise_requests or separately handled.
        // If there is a separate users collection, we might need to update it, but mostly we rely on franchise_requests for plan.

        return NextResponse.json({ success: true, message: "Plan upgraded successfully" });

    } catch (error: any) {
        console.error('Verify Upgrade Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
