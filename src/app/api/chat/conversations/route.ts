import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId'); // Legacy INT

    if (!userId) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    try {
        // Resolve UUID
        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('franchise_id', userId)
            .maybeSingle();

        if (!profile) {
            return NextResponse.json({ error: 'User not found in Supabase' }, { status: 404 });
        }

        const myUuid = profile.id;

        // Call RPC
        const { data, error } = await supabase.rpc('get_my_conversations', {
            p_user_id: myUuid
        });

        if (error) throw error;

        // Transform for frontend
        const conversations = data.map((c: any) => ({
            otherUserId: c.other_user_id, // UUID
            otherUserLegacyId: c.other_user_legacy_id, // INT
            otherUserName: c.other_user_name,
            otherUserAvatar: c.other_user_avatar,
            lastMessage: c.last_message,
            lastMessageTime: c.last_message_time,
            unreadCount: c.unread_count,
        }));

        return NextResponse.json(conversations);
    } catch (error: any) {
        console.error('Conversations API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
