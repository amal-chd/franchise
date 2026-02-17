import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';

// GET: List friends or pending requests
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status'); // 'accepted' or 'pending'

    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    try {
        let result = [];

        if (status === 'pending') {
            // Requests received BY me (friend_id == userId)
            const snapshot = await firestore.collection('friendships')
                .where('friend_id', '==', String(userId))
                .where('status', '==', 'pending')
                .get();

            // Fetch sender details
            result = await Promise.all(snapshot.docs.map(async (doc: any) => {
                const data = doc.data();
                const senderDoc = await firestore.collection('franchise_requests').doc(data.user_id).get();
                const sender = senderDoc.data();
                return {
                    id: doc.id,
                    user_id: data.user_id,
                    f_name: sender?.name || 'Unknown',
                    image: sender?.profile_image || null,
                    status: 'pending'
                };
            }));

        } else {
            // Accepted friends (Bi-directional in meaning, stored as one record?)
            // If stored as A->B accepted, we check both user_id=me AND friend_id=me ???
            // Typically friendship is stored as two records or queried with OR. 
            // Firestore doesn't support OR across different fields easily in one query without multiple queries.

            // Query 1: I am the requester
            const q1 = await firestore.collection('friendships')
                .where('user_id', '==', String(userId))
                .where('status', '==', 'accepted')
                .get();

            // Query 2: I am the receiver
            const q2 = await firestore.collection('friendships')
                .where('friend_id', '==', String(userId))
                .where('status', '==', 'accepted')
                .get();

            const friendsMaps = new Map();

            const processDoc = async (doc: any, isRequester: boolean) => {
                const data = doc.data();
                const otherId = isRequester ? data.friend_id : data.user_id;

                if (friendsMaps.has(otherId)) return; // distinct

                const otherDoc = await firestore.collection('franchise_requests').doc(otherId).get();
                const other = otherDoc.data();

                friendsMaps.set(otherId, {
                    id: doc.id,
                    friend_id: otherId,
                    friend_name: other?.name || 'Unknown',
                    friend_image: other?.profile_image || null,
                    status: 'accepted'
                });
            };

            await Promise.all([
                ...q1.docs.map((d: any) => processDoc(d, true)),
                ...q2.docs.map((d: any) => processDoc(d, false))
            ]);

            result = Array.from(friendsMaps.values());
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Friends API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Actions
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, friendId, action } = body; // action: 'request', 'accept', 'reject'

        if (!userId || !friendId || !action) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        if (action === 'request') {
            // Check if exists
            const exists = await firestore.collection('friendships')
                .where('user_id', '==', String(userId))
                .where('friend_id', '==', String(friendId))
                .limit(1)
                .get();

            if (!exists.empty) {
                return NextResponse.json({ message: 'Request already sent or exists' });
            }

            await firestore.collection('friendships').add({
                user_id: String(userId),
                friend_id: String(friendId),
                status: 'pending',
                created_at: new Date()
            });
            return NextResponse.json({ success: true, message: 'Request sent' });
        }
        else if (action === 'accept') {
            // Find the request where friend came TO me (user_id=friendId, friend_id=userId)
            const snapshot = await firestore.collection('friendships')
                .where('user_id', '==', String(friendId))
                .where('friend_id', '==', String(userId))
                .where('status', '==', 'pending')
                .limit(1)
                .get();

            if (snapshot.empty) {
                return NextResponse.json({ error: 'Request not found' }, { status: 404 });
            }

            await firestore.collection('friendships').doc(snapshot.docs[0].id).update({
                status: 'accepted',
                updated_at: new Date()
            });
            return NextResponse.json({ success: true, message: 'Request accepted' });
        }
        else if (action === 'reject') {
            const snapshot = await firestore.collection('friendships')
                .where('user_id', '==', String(friendId))
                .where('friend_id', '==', String(userId))
                .where('status', '==', 'pending')
                .limit(1)
                .get();

            if (!snapshot.empty) {
                await firestore.collection('friendships').doc(snapshot.docs[0].id).delete();
            }
            return NextResponse.json({ success: true, message: 'Request rejected' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
