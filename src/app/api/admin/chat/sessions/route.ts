import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function GET() {
    try {
        const sessions = await executeQuery({
            query: `
                SELECT 
                    cs.id,
                    cs.status,
                    cs.franchise_id,
                    cs.created_at,
                    cs.last_message_at,
                    f.name as franchise_name,
                    f.email as franchise_email,
                    f.phone as franchise_phone,
                    f.city as franchise_city,
                    f.plan_selected as plan,
                    f.zone_id,
                    COALESCE(
                        (SELECT message FROM chat_messages WHERE session_id = cs.id ORDER BY created_at DESC LIMIT 1), 
                        'No messages'
                    ) as last_message_preview,
                    (SELECT sender_type FROM chat_messages WHERE session_id = cs.id ORDER BY created_at DESC LIMIT 1) as last_sender_type,
                    (SELECT id FROM chat_messages WHERE session_id = cs.id ORDER BY created_at DESC LIMIT 1) as last_message_id 
                FROM chat_sessions cs 
                LEFT JOIN franchise_requests f ON cs.franchise_id = f.id
                ORDER BY cs.last_message_at DESC
            `,
            values: []
        });
        return NextResponse.json(sessions);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }
}
