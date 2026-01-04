import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// GET: Fetch community feed
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId'); // Legacy INT
    const authorId = searchParams.get('authorId'); // Legacy INT

    try {
        // Resolve UUIDs from Legacy IDs
        let userUuid = null;
        let authorUuid = null;

        if (userId) {
            const { data } = await supabase.from('profiles').select('id').eq('franchise_id', userId).single();
            if (data) userUuid = data.id;
        }

        if (authorId) {
            const { data } = await supabase.from('profiles').select('id').eq('franchise_id', authorId).single();
            if (data) authorUuid = data.id;
        }

        if (!userUuid) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');

        const { data, error } = await supabase.rpc('get_community_feed', {
            current_user_id: userUuid,
            filter_author_id: authorUuid,
            page_number: page,
            page_size: limit
        });

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Create a new post
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, contentText, imageUrl } = body; // userId is legacy INT

        // Resolve UUID
        const { data: profile } = await supabase.from('profiles').select('id').eq('franchise_id', userId).single();
        if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const { data, error } = await supabase.from('community_posts').insert({
            user_id: profile.id,
            content_text: contentText,
            image_url: imageUrl
        }).select().single();

        if (error) throw error;

        // Return simpler format or full object
        return NextResponse.json({ success: true, result: { insertId: data.id, ...data } });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
