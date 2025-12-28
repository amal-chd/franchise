import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

// GET: Fetch community feed
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    try {
        // Fetch posts from self and friends (or all for public feed)
        // For simplicity, we fetch all posts DESC for now.
        // In a real app with many users, join with friendships table.

        let query = `
            SELECT p.*, 
            (SELECT COUNT(*) FROM community_interactions WHERE post_id = p.id AND type = 'like') as likes_count,
            (SELECT COUNT(*) FROM community_interactions WHERE post_id = p.id AND type = 'comment') as comments_count,
            (SELECT COUNT(*) FROM community_interactions WHERE post_id = p.id AND type = 'like' AND user_id = ?) as is_liked_by_me
            FROM community_posts p 
            ORDER BY created_at DESC
        `;

        const result = await executeQuery({
            query,
            values: [userId || 0]
        });

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Create a new post
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, userName, userImage, contentText, imageUrl, role } = body;

        if (!userId || !contentText) {
            return NextResponse.json({ error: 'User ID and Content are required' }, { status: 400 });
        }

        const result = await executeQuery({
            query: `INSERT INTO community_posts (user_id, user_name, user_image, content_text, image_url, role) VALUES (?, ?, ?, ?, ?, ?)`,
            values: [userId, userName, userImage, contentText, imageUrl, role || 'franchise']
        });

        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
