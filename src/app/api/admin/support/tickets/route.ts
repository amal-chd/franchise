import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
    try {
        // Fetch tickets from Supabase with latest reply
        const { data: tickets, error } = await supabase
            .from('support_tickets')
            .select(`
                *,
                latest_reply:ticket_replies(
                    message,
                    created_at
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Process data to match expected format (optional, if frontend expects flat structure)
        // transforming latest_reply array to single object if needed, or frontend handles it.
        // For now returning as is, but latest_reply will be an array in Supabase response.
        const processedTickets = tickets.map(t => ({
            ...t,
            latest_reply: t.latest_reply?.[0]?.message || null,
            franchise_name: 'Unknown', // We might need to link this if franchise_id exists
            zone_name: 'N/A'
        }));

        return NextResponse.json(processedTickets);

        if (!Array.isArray(tickets)) {
            return NextResponse.json([]);
        }

        return NextResponse.json(tickets);
    } catch (error: any) {
        console.error('Fetch Tickets Error:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
