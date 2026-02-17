import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
        return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    try {
        const snapshot = await firestore.collection('chat_messages')
            .where('session_id', '==', sessionId)
            .orderBy('created_at', 'asc')
            .get();

        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            created_at: doc.data().created_at?.toDate ? doc.data().created_at.toDate() : doc.data().created_at
        }));

        return NextResponse.json(messages);
    } catch (error: any) {
        console.error('Fetch Messages Error:', error);
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

        // Insert into chat_messages
        const newMessage = {
            session_id: sessionId,
            sender_type: senderType,
            // sender_id: senderId || null, // Optional if we want to track
            message: message || '',
            attachment_url: attachmentUrl || null,
            attachment_type: attachmentType || null,
            created_at: new Date()
        };

        const docRef = await firestore.collection('chat_messages').add(newMessage);

        // Update session last_message
        const lastMsg = message || (attachmentType === 'image' ? 'Image' : 'File');

        await firestore.collection('chat_sessions').doc(sessionId).update({
            last_message: lastMsg,
            last_message_time: new Date(),
            last_sender_type: senderType,
            last_message_id: docRef.id,
            updated_at: new Date()
        });

        return NextResponse.json({ success: true, id: docRef.id });
    } catch (error: any) {
        console.error('Send Message Error:', error);
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }
}
