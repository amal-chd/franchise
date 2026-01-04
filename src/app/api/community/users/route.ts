import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const userId = searchParams.get('userId'); // Legacy ID

    if (!query) {
        return NextResponse.json([]);
    }

    try {
        let currentUserId = null;
        if (userId) {
            const { data } = await supabase.from('profiles').select('id').eq('franchise_id', userId).single();
            if (data) currentUserId = data.id;
        }

        if (!currentUserId) {
            // If user not found, maybe return simple search without status?
            // Or just fail. Let's return error or empty.
            // For guests, we can pass a dummy UUID? Or handle null in RPC?
            // RPC expects uuid.
            return NextResponse.json([], { status: 200 });
        }

        const { data, error } = await supabase.rpc('search_users', {
            search_query: query,
            current_user_id: currentUserId
        });

        if (error) throw error;

        // Transform to match frontend expectations
        // Frontend expects: f_name, l_name, location, image, role, friendship_status
        const result = data.map((u: any) => ({
            id: u.legacy_id, // Frontend uses INT ID
            f_name: u.user_name,
            l_name: '',
            location: u.location,
            image: u.user_image,
            role: 'franchise',
            friendship_status: u.friendship_status
        }));

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
