import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';

// GET: Fetch community feed
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const authorId = searchParams.get('authorId');

    try {
        let query: any = firestore.collection('community_posts')
            .orderBy('created_at', 'desc');

        if (authorId) {
            query = query.where('user_id', '==', authorId);
        }

        const limit = parseInt(searchParams.get('limit') || '10');
        // Pagination in Firestore typically uses 'startAfter', but here we'll effectively list recent posts.
        // Implementing full pagination requires client to send last doc snapshot or using offset (update V9 SDK).
        // For simplicity in migration, just limit:
        query = query.limit(limit);

        const snapshot = await query.get();
        const data = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
            created_at: doc.data().created_at?.toDate ? doc.data().created_at.toDate() : doc.data().created_at
        }));

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Create a new post
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, contentText, imageUrl } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Ensure user exists (in franchise_requests)
        const userDoc = await firestore.collection('franchise_requests').doc(String(userId)).get();
        if (!userDoc.exists) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        const userData = userDoc.data();

        const postData = {
            user_id: String(userId),
            // Embed minimal user info to avoid joins if needed, or rely on client fetching user details
            user_name: userData?.name || 'Unknown',
            user_image: userData?.image || null, // Assuming image field exists
            content_text: contentText,
            image_url: imageUrl,
            likes_count: 0,
            comments_count: 0,
            created_at: new Date()
        };

        const docRef = await firestore.collection('community_posts').add(postData);

        return NextResponse.json({ success: true, result: { insertId: docRef.id, ...postData } });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
