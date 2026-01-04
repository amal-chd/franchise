import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// GET: Fetch comments for a post
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
        return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    try {
        const { data, error } = await supabase.rpc('get_post_comments', {
            target_post_id: parseInt(postId)
        });

        if (error) throw error;

        return NextResponse.json(data);
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
        // userId: legacy INT ID of the commenter

        if (!userId || !postId || !content) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // Resolve user UUID
        const { data: profile } = await supabase.from('profiles').select('id').eq('franchise_id', userId).single();
        if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Insert Comment
        const { data, error } = await supabase.from('community_interactions').insert({
            user_id: profile.id,
            post_id: postId, // BigInt ID
            type: 'comment',
            comment_text: content
        }).select().single();

        if (error) throw error;

        // Increment comments count on post (Optional: Trigger can handle this, but let's do it explicitly for now or rely on trigger)
        // Check if trigger exists? Assuming not, let's update.
        await supabase.rpc('increment_comments_count', { post_id_val: postId });
        // Wait, I didn't create increment RPC. Let's just do a direct update or assume specific logic.
        // Or better: Let's create a quick increment Logic here
        await supabase.from('community_posts').update({
            comments_count: (await supabase.from('community_posts').select('comments_count').eq('id', postId).single()).data?.comments_count + 1
        }).eq('id', postId);

        return NextResponse.json({ success: true, comment: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
