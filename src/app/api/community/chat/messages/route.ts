import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';

function getChatId(user1: string, user2: string) {
    return [user1, user2].sort().join('_');
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const friendId = searchParams.get('friendId');

    if (!userId || !friendId) {
        return NextResponse.json({ error: 'Missing IDs' }, { status: 400 });
    }

    try {
        const chatId = getChatId(userId, friendId);

        const snapshot = await firestore.collection('community_messages')
            .where('chat_id', '==', chatId)
            .orderBy('created_at', 'asc')
            .get();

        const messages = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
            created_at: doc.data().created_at?.toDate ? doc.data().created_at.toDate() : doc.data().created_at
        }));

        return NextResponse.json(messages);
    } catch (error: any) {
        console.error('Fetch Community Messages Error:', error);
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

        const chatId = getChatId(senderId, receiverId);

        const newMessage = {
            chat_id: chatId,
            sender_id: senderId,
            receiver_id: receiverId,
            message: message || '',
            attachment_url: attachmentUrl || null,
            created_at: new Date()
        };

        await firestore.collection('community_messages').add(newMessage);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Send Community Message Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
