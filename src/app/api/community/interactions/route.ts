import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, postId, type, commentText } = body; // type: 'like' or 'comment'

        if (!userId || !postId || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (type === 'like') {
            // Check if already liked
            const snapshot = await firestore.collection('community_interactions')
                .where('user_id', '==', String(userId))
                .where('post_id', '==', String(postId))
                .where('type', '==', 'like')
                .limit(1)
                .get();

            if (!snapshot.empty) {
                // Unlike
                await firestore.collection('community_interactions').doc(snapshot.docs[0].id).delete();
                // Decrement like count
                const postRef = firestore.collection('community_posts').doc(String(postId));
                const p = await postRef.get();
                if (p.exists) {
                    await postRef.update({
                        likes_count: Math.max(0, (p.data()?.likes_count || 1) - 1)
                    });
                }

                return NextResponse.json({ success: true, action: 'unliked' });
            } else {
                // Like
                await firestore.collection('community_interactions').add({
                    user_id: String(userId),
                    post_id: String(postId),
                    type: 'like',
                    created_at: new Date()
                });

                // Increment like count
                const postRef = firestore.collection('community_posts').doc(String(postId));
                const p = await postRef.get();
                if (p.exists) {
                    await postRef.update({
                        likes_count: (p.data()?.likes_count || 0) + 1
                    });
                }

                return NextResponse.json({ success: true, action: 'liked' });
            }
        }
        else if (type === 'comment') {
            if (!commentText) return NextResponse.json({ error: 'Comment text required' }, { status: 400 });

            await firestore.collection('community_interactions').add({
                user_id: String(userId),
                post_id: String(postId),
                type: 'comment',
                comment_text: commentText,
                created_at: new Date()
            });

            // Increment comments count
            const postRef = firestore.collection('community_posts').doc(String(postId));
            const p = await postRef.get();
            if (p.exists) {
                await postRef.update({
                    comments_count: (p.data()?.comments_count || 0) + 1
                });
            }

            return NextResponse.json({ success: true, action: 'commented' });
        }

        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET Comments for a post
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) return NextResponse.json({ error: 'Post ID required' }, { status: 400 });

    try {
        const snapshot = await firestore.collection('community_interactions')
            .where('post_id', '==', String(postId))
            .where('type', '==', 'comment')
            .orderBy('created_at', 'asc')
            .get();

        const comments = await Promise.all(snapshot.docs.map(async (doc) => {
            const data = doc.data();
            let user_name = 'Unknown';
            let user_image = null;

            if (data.user_id) {
                const uDoc = await firestore.collection('franchise_requests').doc(data.user_id).get();
                if (uDoc.exists) {
                    user_name = uDoc.data()?.name || 'Unknown';
                    user_image = uDoc.data()?.profile_image;
                }
            }

            return {
                id: doc.id,
                ...data,
                user_name,
                user_image
            };
        }));

        return NextResponse.json(comments);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
