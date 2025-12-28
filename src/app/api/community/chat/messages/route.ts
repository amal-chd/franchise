import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const friendId = searchParams.get('friendId');

    if (!userId || !friendId) {
        return NextResponse.json({ error: 'Missing IDs' }, { status: 400 });
    }

    try {
        const query = `
            SELECT * FROM community_messages
            WHERE (sender_id = ? AND receiver_id = ?) 
               OR (sender_id = ? AND receiver_id = ?)
            ORDER BY created_at ASC
        `;
        const result = await executeQuery({
            query,
            values: [userId, friendId, friendId, userId]
        });

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { senderId, receiverId, message, attachmentUrl } = body;

        if (!senderId || !receiverId || (!message && !attachmentUrl)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const result = await executeQuery({
            query: `INSERT INTO community_messages (sender_id, receiver_id, message, attachment_url) VALUES (?, ?, ?, ?)`,
            values: [senderId, receiverId, message, attachmentUrl]
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
