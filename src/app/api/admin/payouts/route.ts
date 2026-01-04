import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { data: franchises, error } = await supabase
            .from('franchise_requests')
            .select(`
                id,
                name,
                email,
                phone,
                city,
                upi_id,
                bank_account_number,
                ifsc_code,
                bank_name,
                pricing_plan,
                status
            `)
            .eq('status', 'approved')
            .order('name', { ascending: true });

        if (error) throw error;

        // Map fields to match legacy response format if needed (e.g. name -> full_name)
        const results = franchises.map(f => ({
            id: f.id,
            full_name: f.name,
            email: f.email,
            phone: f.phone,
            city: f.city,
            upi_id: f.upi_id,
            bank_account_number: f.bank_account_number,
            ifsc_code: f.ifsc_code,
            bank_name: f.bank_name,
            plan_selected: f.pricing_plan, // Mapped from pricing_plan to plan_selected
            status: f.status
        }));

        return NextResponse.json(results);
    } catch (error: any) {
        console.error('Fetch Payouts Error:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
