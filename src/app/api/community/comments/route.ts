import { NextResponse } from 'next/server';
import { firestore, admin } from '@/lib/firebase';

// GET: Fetch comments for a post
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
        return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    try {
        // Fetch comments from 'community_interactions' where type is 'comment'
        // Need to join with user details manually or store basic user info in comment
        const snapshot = await firestore.collection('community_interactions')
            .where('post_id', '==', postId)
            .where('type', '==', 'comment')
            .orderBy('created_at', 'asc')
            .get();

        const comments = await Promise.all(snapshot.docs.map(async (doc: any) => {
            const data = doc.data();
            // Fetch user details for each comment
            // Optimization: Store user_name/image in the comment doc to avoid N+1 fetches
            let user = { name: 'Unknown', image: null };
            if (data.user_id) {
                const userDoc = await firestore.collection('franchise_requests').doc(data.user_id).get();
                if (userDoc.exists) {
                    const uData = userDoc.data();
                    user = { name: uData?.name, image: uData?.profile_image };
                }
            }

            return {
                id: doc.id,
                post_id: data.post_id,
                content: data.comment_text,
                created_at: data.created_at?.toDate ? data.created_at.toDate() : data.created_at,
                user_name: user.name,
                user_image: user.image
            };
        }));

        return NextResponse.json(comments);
    } catch (error: any) {
        console.error('Comments API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Add a new comment
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, postId, content } = body;

        if (!userId || !postId || !content) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const newComment = {
            user_id: String(userId),
            post_id: String(postId),
            type: 'comment',
            comment_text: content,
            created_at: new Date()
        };

        const docRef = await firestore.collection('community_interactions').add(newComment);

        // Update comments count on the post
        try {
            await firestore.collection('community_posts').doc(String(postId)).update({
                comments_count: admin.firestore.FieldValue.increment(1)
            });
        } catch (updateError) {
            console.error('Failed to update comment count:', updateError);
        }

        return NextResponse.json({ success: true, comment: { id: docRef.id, ...newComment } });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
