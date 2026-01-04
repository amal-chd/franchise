import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Helper to resolve UUID
async function getUuid(legacyId: string | number) {
    const { data } = await supabase.from('profiles').select('id').eq('franchise_id', legacyId).single();
    return data?.id || null;
}

// GET: List friends or pending requests
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId'); // Legacy INT
    const status = searchParams.get('status'); // 'accepted' or 'pending'

    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    try {
        const myUuid = await getUuid(userId);
        if (!myUuid) return NextResponse.json([], { status: 200 }); // User not migrated yet?

        let data = [];

        if (status === 'pending') {
            // Requests received BY me (I am friend_id)
            const { data: requests, error } = await supabase
                .from('friendships')
                .select(`
                    id,
                    created_at,
                    status,
                    sender:user_id ( id, username, franchise_id, avatar_url )
                `)
                .eq('friend_id', myUuid)
                .eq('status', 'pending');

            if (error) throw error;

            // Transform to legacy structure
            data = requests.map((r: any) => ({
                id: r.id,
                user_id: r.sender.franchise_id, // Legacy ID expects INT
                friend_id: userId,
                status: r.status,
                f_name: r.sender.username,
                other_user_id: r.sender.franchise_id
            }));

        } else {
            // Accepted friends (Bi-directional)
            const { data: friends, error } = await supabase
                .from('friendships')
                .select(`
                    id,
                    status,
                    user_id,
                    friend_id,
                    user:user_id ( id, username, franchise_id, avatar_url ),
                    friend:friend_id ( id, username, franchise_id, avatar_url )
                `)
                .or(`user_id.eq.${myUuid},friend_id.eq.${myUuid}`)
                .eq('status', 'accepted');

            if (error) throw error;

            data = friends.map((f: any) => {
                const isMyRequest = f.user_id === myUuid;
                const other = isMyRequest ? f.friend : f.user;
                return {
                    id: f.id,
                    status: f.status,
                    friend_name: other.username,
                    friend_image: other.avatar_url,
                    other_user_id: other.franchise_id
                };
            });
        }

        return NextResponse.json(data);
    } catch (error: any) {
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

        const myUuid = await getUuid(userId);
        const targetUuid = await getUuid(friendId);

        if (!myUuid || !targetUuid) {
            return NextResponse.json({ error: 'User(s) not found in new system' }, { status: 400 });
        }

        if (action === 'request') {
            const { error } = await supabase.from('friendships').insert({
                user_id: myUuid,
                friend_id: targetUuid,
                status: 'pending'
            });
            if (error) throw error;
            return NextResponse.json({ success: true, message: 'Request sent' });
        }
        else if (action === 'accept') {
            // targetId (friend) SENT the request to ME (userId)
            const { error } = await supabase.from('friendships').update({ status: 'accepted' })
                .eq('user_id', targetUuid) // Sender
                .eq('friend_id', myUuid); // Receiver
            if (error) throw error;
            return NextResponse.json({ success: true, message: 'Request accepted' });
        }
        else if (action === 'reject') {
            const { error } = await supabase.from('friendships').delete()
                .eq('user_id', targetUuid)
                .eq('friend_id', myUuid);
            if (error) throw error;
            return NextResponse.json({ success: true, message: 'Request rejected' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
