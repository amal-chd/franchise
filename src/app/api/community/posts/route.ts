import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

// GET: Fetch community feed
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const authorId = searchParams.get('authorId');

    try {
        // Base query - Fetch posts
        // We allow author filtering.

        let query = `
            SELECT p.*, 
            (SELECT COUNT(*) FROM community_interactions WHERE post_id = p.id AND type = 'like') as likes_count,
            (SELECT COUNT(*) FROM community_interactions WHERE post_id = p.id AND type = 'comment') as comments_count,
            (SELECT COUNT(*) FROM community_interactions WHERE post_id = p.id AND type = 'like' AND user_id = ?) as is_liked_by_me
            FROM community_posts p 
        `;

        const values: any[] = [userId || 0];


        // Strict filtering if authorId matches a number
        if (authorId && !isNaN(Number(authorId))) {
            console.log(`Filtering posts for authorId: ${authorId}`);
            query += ` WHERE p.user_id = ? `;
            values.push(authorId);
        } else {
            console.log('No authorId provided or invalid, fetching all posts');
        }

        query += ` ORDER BY created_at DESC`;

        const result = await executeQuery({
            query,
            values
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('API Error:', error);
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
