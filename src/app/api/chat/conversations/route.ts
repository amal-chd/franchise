
import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId'); // Assuming this is the franchise_id

    if (!userId) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    try {
        // In the new Firestore architecture, 'userId' from the mobile app corresponds to 'franchise_id'
        // We fetch the chat sessions for this franchise. Typically there is one 'Support' session.
        const snapshot = await firestore.collection('chat_sessions')
            .where('franchise_id', '==', userId)
            .orderBy('updated_at', 'desc')
            .get();

        const conversations = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                otherUserId: 'admin', // Static for now as franchises chat with Support/Admin
                otherUserLegacyId: 0,
                otherUserName: 'Support Team',
                otherUserAvatar: '', // Add default avatar URL if needed
                lastMessage: data.last_message || '',
                lastMessageTime: data.updated_at?.toDate ? data.updated_at.toDate() : data.updated_at,
                unreadCount: 0, // TODO: Implement unread count logic if needed in chat_sessions
            };
        });

        return NextResponse.json(conversations);
    } catch (error: any) {
        console.error('Conversations API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
