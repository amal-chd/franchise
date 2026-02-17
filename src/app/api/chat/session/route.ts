import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const franchiseId = searchParams.get('franchiseId');

    if (!franchiseId) {
        return NextResponse.json({ error: 'Franchise ID required' }, { status: 400 });
    }

    try {
        // Check for active session in Firestore
        // Using `chat_sessions` collection
        const sessionsSnapshot = await firestore.collection('chat_sessions')
            .where('franchise_id', '==', franchiseId)
            .where('status', '==', 'open')
            .limit(1)
            .get();

        if (!sessionsSnapshot.empty) {
            const sessionDoc = sessionsSnapshot.docs[0];
            const sessionData = sessionDoc.data();

            // Get last message from 'chat_messages' collection
            // Optimally, we store last_message in session doc itself as shown in POST refactor of messages

            return NextResponse.json({
                id: sessionDoc.id,
                ...sessionData,
                last_message_preview: sessionData.last_message || null,
                last_sender_type: sessionData.last_sender_type || null,
                last_message_id: sessionData.last_message_id || null
            });
        }

        // Create new session if none exists
        const newSession = {
            franchise_id: franchiseId,
            status: 'open',
            created_at: new Date(),
            updated_at: new Date()
        };

        const docRef = await firestore.collection('chat_sessions').add(newSession);

        return NextResponse.json({
            id: docRef.id,
            ...newSession
        });
    } catch (error: any) {
        console.error('Chat Session API Error:', error);
        return NextResponse.json({ error: 'Failed to get session' }, { status: 500 });
    }
}
