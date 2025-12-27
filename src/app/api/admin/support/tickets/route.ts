import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function GET() {
    try {
        const tickets = await executeQuery({
            query: `
                SELECT 
                    t.*, 
                    f.name as franchise_name, 
                    f.city as zone_name,
                    (SELECT message FROM ticket_replies WHERE ticket_id = t.id ORDER BY created_at DESC LIMIT 1) as latest_reply
                FROM support_tickets t 
                LEFT JOIN franchise_requests f ON t.franchise_id = f.id 
                ORDER BY t.created_at DESC
            `,
            values: [],
        });

        if (!Array.isArray(tickets)) {
            return NextResponse.json([]);
        }

        return NextResponse.json(tickets);
    } catch (error: any) {
        console.error('Fetch Tickets Error:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
