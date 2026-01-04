
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
    try {
        // Fetch logs 
        const { data: logs, error } = await supabaseAdmin
            .from('plan_upgrade_logs')
            .select(`
        *,
        franchise_requests:franchise_id (name, email, phone)
      `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(logs);
    } catch (error: any) {
        console.error('Fetch Upgrades Logs Error:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
