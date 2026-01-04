
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            franchiseId, // ID from app (int)
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

        // 2. Log to plan_upgrade_logs (Supabase)
        const { error: logError } = await supabaseAdmin
            .from('plan_upgrade_logs')
            .insert({
                franchise_id: franchiseId.toString(),
                old_plan: oldPlan,
                new_plan: newPlan,
                amount: amount / 100, // Convert poise to main currency
                payment_id: razorpay_payment_id,
                order_id: razorpay_order_id,
                created_at: new Date().toISOString()
            });

        if (logError) {
            console.error('Log Insert Error:', logError);
            // We don't stop here, but it's bad.
        }

        // 3. Update Franchise Request / Profile Plan (Supabase)
        // Assuming 'franchise_requests' is the table storing plan info for franchiseId (id matches)
        // Also updating profiles if needed, but let's stick to franchise_requests or profiles.
        // Based on user schema, 'profiles' has 'franchise_id' column, and 'franchise_requests' has 'id'.
        // If 'franchiseId' passes from app is likely the ID of 'franchise_requests'.

        // Update franchise_requests
        const { error: updateError } = await supabaseAdmin
            .from('franchise_requests')
            .update({
                plan_selected: newPlan,
                pricing_plan: newPlan, // Update both to be safe
                razorpay_order_id: razorpay_order_id,
                razorpay_payment_id: razorpay_payment_id,
                payment_status: 'completed'
            })
            .eq('id', franchiseId);

        if (updateError) {
            console.error('Franchise Update Error:', updateError);
            return NextResponse.json({ error: "Payment verified but plan update failed. Contact support." }, { status: 500 });
        }

        // Also update 'profiles' if it exists linked to this franchise
        await supabaseAdmin
            .from('profiles')
            .update({ pricing_plan: newPlan })
            .eq('franchise_id', franchiseId);


        return NextResponse.json({ success: true, message: "Plan upgraded successfully" });

    } catch (error: any) {
        console.error('Verify Upgrade Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
