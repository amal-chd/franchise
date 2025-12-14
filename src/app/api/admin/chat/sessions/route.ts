import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function GET() {
    try {
        const sessions = await executeQuery({
            query: `
                SELECT 
                    cs.*, 
                    COALESCE(
                        (SELECT message FROM chat_messages WHERE session_id = cs.id ORDER BY created_at DESC LIMIT 1), 
                        'No messages'
                    ) as last_message_preview 
                FROM chat_sessions cs 
                ORDER BY cs.last_message_at DESC
            `,
            values: []
        });
        return NextResponse.json(sessions);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }
}
