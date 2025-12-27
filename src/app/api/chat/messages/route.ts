import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
        return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    try {
        const messages = await executeQuery({
            query: 'SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC',
            values: [sessionId]
        });
        return NextResponse.json(messages);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { sessionId, senderType, senderId, message, attachmentUrl, attachmentType } = body;

        if (!sessionId || (!message && !attachmentUrl)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await executeQuery({
            query: 'INSERT INTO chat_messages (session_id, sender_type, sender_id, message, attachment_url, attachment_type) VALUES (?, ?, ?, ?, ?, ?)',
            values: [sessionId, senderType, senderId, message || '', attachmentUrl || null, attachmentType || null]
        });

        // Update session last_message_at
        await executeQuery({
            query: 'UPDATE chat_sessions SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?',
            values: [sessionId]
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }
}
