import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const franchiseId = searchParams.get('franchiseId');

    if (!franchiseId) {
        return NextResponse.json({ error: 'Franchise ID required' }, { status: 400 });
    }

    try {
        // Check for active session
        const sessions: any = await executeQuery({
            query: `
                SELECT cs.*,
                    (SELECT message FROM chat_messages WHERE session_id = cs.id ORDER BY created_at DESC LIMIT 1) as last_message_preview,
                    (SELECT sender_type FROM chat_messages WHERE session_id = cs.id ORDER BY created_at DESC LIMIT 1) as last_sender_type,
                    (SELECT id FROM chat_messages WHERE session_id = cs.id ORDER BY created_at DESC LIMIT 1) as last_message_id
                FROM chat_sessions cs 
                WHERE franchise_id = ? AND status = "open" 
                LIMIT 1
            `,
            values: [franchiseId]
        });

        if (sessions.length > 0) {
            return NextResponse.json(sessions[0]);
        }

        // Create new session if none exists
        const result: any = await executeQuery({
            query: 'INSERT INTO chat_sessions (franchise_id) VALUES (?)',
            values: [franchiseId]
        });

        return NextResponse.json({ id: result.insertId, franchise_id: franchiseId, status: 'open' });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to get session' }, { status: 500 });
    }
}
