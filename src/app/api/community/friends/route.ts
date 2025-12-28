import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

// GET: List friends or pending requests
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status'); // 'accepted' or 'pending'

    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    try {
        let query = '';
        const values = [userId, userId];

        if (status === 'pending') {
            // Get requests received BY me
            query = `SELECT f.*, u.name as f_name, '' as l_name, NULL as image 
                     FROM friendships f
                     JOIN franchise_requests u ON f.user_id = u.id 
                     WHERE f.friend_id = ? AND f.status = 'pending'`;
            values.pop(); // Only need userId once
        } else {
            // Accepted friends (Bi-directional check)
            query = `SELECT f.*, 
                     CASE 
                        WHEN f.user_id = ? THEN u2.name 
                        ELSE u1.name 
                     END as friend_name,
                     NULL as friend_image
                     FROM friendships f
                     JOIN franchise_requests u1 ON f.user_id = u1.id
                     JOIN franchise_requests u2 ON f.friend_id = u2.id
                     WHERE (f.user_id = ? OR f.friend_id = ?) AND f.status = 'accepted'`;
            values.push(userId, userId);
        }

        const result = await executeQuery({ query, values });
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Send Friend Request or Accept/Reject
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, friendId, action } = body; // action: 'request', 'accept', 'reject'

        if (!userId || !friendId || !action) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        if (action === 'request') {
            await executeQuery({
                query: 'INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, "pending")',
                values: [userId, friendId]
            });
            return NextResponse.json({ success: true, message: 'Request sent' });
        }
        else if (action === 'accept') {
            await executeQuery({
                query: 'UPDATE friendships SET status = "accepted" WHERE user_id = ? AND friend_id = ?',
                values: [friendId, userId] // Note: friendId is the one who sent request, userId is accepting
            });
            return NextResponse.json({ success: true, message: 'Request accepted' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
