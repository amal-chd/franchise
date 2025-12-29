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
        const values: any[] = [];

        if (status === 'pending') {
            // Get requests received BY me
            // The sender is user_id. We want their details.
            // We alias user_id as other_user_id so frontend knows this is the person to respond to
            query = `SELECT f.*, u.name as f_name, '' as l_name, NULL as image,
                     f.user_id as other_user_id
                     FROM friendships f
                     JOIN franchise_requests u ON f.user_id = u.id 
                     WHERE f.friend_id = ? AND f.status = 'pending'`;
            values.push(userId);
        } else {
            // Accepted friends (Bi-directional check)
            // Determine who the "friend" is relative to the "userId" param
            query = `SELECT f.*, 
                     CASE 
                        WHEN f.user_id = ? THEN u2.name 
                        ELSE u1.name 
                     END as friend_name,
                     NULL as friend_image,
                     CASE 
                        WHEN f.user_id = ? THEN f.friend_id
                        ELSE f.user_id
                     END as other_user_id
                     FROM friendships f
                     JOIN franchise_requests u1 ON f.user_id = u1.id
                     JOIN franchise_requests u2 ON f.friend_id = u2.id
                     WHERE (f.user_id = ? OR f.friend_id = ?) AND f.status = 'accepted'`;
            values.push(userId, userId, userId, userId);
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

        console.log('FRIEND REQUEST API:', { userId, friendId, action });

        if (!userId || !friendId || !action) {
            console.error('Missing fields in friend request:', { userId, friendId, action });
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        if (action === 'request') {
            const query = 'INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, "pending")';
            const values = [userId, friendId];
            console.log('Executing Friend Request Query:', query, values);

            await executeQuery({ query, values });
            return NextResponse.json({ success: true, message: 'Request sent' });
        }
        else if (action === 'accept') {
            // friendId here is the one who SENT the request originally
            const query = 'UPDATE friendships SET status = "accepted" WHERE user_id = ? AND friend_id = ?';
            const values = [friendId, userId];
            console.log('Executing Friend Accept Query:', query, values);

            await executeQuery({ query, values });
            return NextResponse.json({ success: true, message: 'Request accepted' });
        }
        else if (action === 'reject') {
            const query = 'DELETE FROM friendships WHERE user_id = ? AND friend_id = ?';
            const values = [friendId, userId];
            console.log('Executing Friend Reject Query:', query, values);

            await executeQuery({ query, values });
            return NextResponse.json({ success: true, message: 'Request rejected' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        console.error('Friend Request API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
