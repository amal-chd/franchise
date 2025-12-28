import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, postId, type, commentText } = body; // type: 'like' or 'comment'

        if (!userId || !postId || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (type === 'like') {
            // Toggle Like logic
            const check = await executeQuery({
                query: 'SELECT id FROM community_interactions WHERE user_id = ? AND post_id = ? AND type = "like"',
                values: [userId, postId]
            });

            if (Array.isArray(check) && check.length > 0) {
                // Unlike
                await executeQuery({
                    query: 'DELETE FROM community_interactions WHERE id = ?',
                    values: [check[0].id]
                });
                // Decrement count
                await executeQuery({ query: 'UPDATE community_posts SET likes_count = likes_count - 1 WHERE id = ?', values: [postId] });
                return NextResponse.json({ success: true, action: 'unliked' });
            } else {
                // Like
                await executeQuery({
                    query: 'INSERT INTO community_interactions (user_id, post_id, type) VALUES (?, ?, "like")',
                    values: [userId, postId]
                });
                // Increment count
                await executeQuery({ query: 'UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = ?', values: [postId] });
                return NextResponse.json({ success: true, action: 'liked' });
            }
        }
        else if (type === 'comment') {
            if (!commentText) return NextResponse.json({ error: 'Comment text required' }, { status: 400 });

            await executeQuery({
                query: 'INSERT INTO community_interactions (user_id, post_id, type, comment_text) VALUES (?, ?, "comment", ?)',
                values: [userId, postId, commentText]
            });
            // Increment count
            await executeQuery({ query: 'UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = ?', values: [postId] });
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
        const result = await executeQuery({
            query: `SELECT i.*, u.name as user_name, NULL as user_image 
                    FROM community_interactions i
                    LEFT JOIN franchise_requests u ON i.user_id = u.id 
                    WHERE post_id = ? AND type = 'comment' 
                    ORDER BY created_at ASC`,
            values: [postId]
        });
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
