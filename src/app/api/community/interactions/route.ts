import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Helper to resolve UUID
async function getUuid(legacyId: string | number) {
    const { data } = await supabase.from('profiles').select('id').eq('franchise_id', legacyId).single();
    return data?.id || null;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, postId, type, commentText } = body; // type: 'like' or 'comment'

        if (!userId || !postId || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const userUuid = await getUuid(userId);
        if (!userUuid) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        if (type === 'like') {
            // Check if already liked
            const { data: existing, error: checkError } = await supabase
                .from('community_interactions')
                .select('id')
                .eq('user_id', userUuid)
                .eq('post_id', postId)
                .eq('type', 'like')
                .maybeSingle(); // Use maybeSingle to avoid 406 error if not found

            if (checkError) throw checkError;

            if (existing) {
                // Unlike
                const { error } = await supabase.from('community_interactions').delete().eq('id', existing.id);
                if (error) throw error;
                return NextResponse.json({ success: true, action: 'unliked' });
            } else {
                // Like
                const { error } = await supabase.from('community_interactions').insert({
                    user_id: userUuid,
                    post_id: postId,
                    type: 'like'
                });
                if (error) throw error;
                return NextResponse.json({ success: true, action: 'liked' });
            }
        }
        else if (type === 'comment') {
            if (!commentText) return NextResponse.json({ error: 'Comment text required' }, { status: 400 });

            const { error } = await supabase.from('community_interactions').insert({
                user_id: userUuid,
                post_id: postId,
                type: 'comment',
                comment_text: commentText
            });

            if (error) throw error;
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
        // Fetch comments with user details
        const { data, error } = await supabase
            .from('community_interactions')
            .select(`
                *,
                user:profiles ( username, avatar_url )
            `)
            .eq('post_id', postId)
            .eq('type', 'comment')
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Transform for frontend
        const result = data.map((i: any) => ({
            ...i,
            user_name: i.user?.username || 'Unknown',
            user_image: i.user?.avatar_url
        }));

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
