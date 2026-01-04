import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { data: sessions, error } = await supabase
            .from('admin_chat_sessions')
            .select(`
                *,
                franchise_requests!fk_franchise (
                    name,
                    email,
                    phone,
                    city,
                    pricing_plan
                )
            `)
            .order('last_message_time', { ascending: false });

        if (error) {
            // Fallback if relation not found (might happen if foreign key is missing)
            console.log("Error with relation fetch, attempting raw fetch", error);
            const { data: rawSessions, error: rawError } = await supabase
                .from('admin_chat_sessions')
                .select('*')
                .order('last_message_time', { ascending: false });

            if (rawError) throw rawError;

            // We would need to manually fetch franchise details but let's assume FK exists or we fix it
            return NextResponse.json(rawSessions || []);
        }

        // Map fields to match frontend expectation
        const formattedSessions = sessions?.map((s: any) => ({
            id: s.id,
            status: s.status,
            franchise_id: s.franchise_id,
            created_at: s.created_at,
            last_message_at: s.last_message_time || s.created_at, // Fallback to created_at
            franchise_name: s.franchise_requests?.name || 'Unknown',
            franchise_email: s.franchise_requests?.email,
            franchise_phone: s.franchise_requests?.phone,
            franchise_city: s.franchise_requests?.city,
            plan: s.franchise_requests?.pricing_plan,
            last_message_preview: s.last_message,
            // last_sender_type info might be missing unless we fetch last msg again or store it in session
            // For now we rely on last_message stored on session
        }));

        return NextResponse.json(formattedSessions);
    } catch (error: any) {
        console.error('Admin Sessions Error:', error);
        return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }
}
