import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const franchiseId = searchParams.get('franchiseId');

    if (!franchiseId) {
        return NextResponse.json({ error: 'Franchise ID required' }, { status: 400 });
    }

    try {
        // Check for active session using Supabase Admin
        const { data: sessions, error } = await supabaseAdmin
            .from('admin_chat_sessions')
            .select(`
                *,
                admin_chats (
                    id,
                    message,
                    sender_type,
                    created_at
                )
            `)
            .eq('franchise_id', parseInt(franchiseId)) // Ensure numeric type match
            .eq('status', 'open')
            .limit(1);

        if (error) {
            console.error('Supabase Session Fetch Error:', error);
            throw error;
        }

        if (sessions && sessions.length > 0) {
            const session = sessions[0];
            // Sort messages to get the last one if returned
            const messages = session.admin_chats || [];
            // Sort descending by created_at
            messages.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            const lastMsg = messages.length > 0 ? messages[0] : null;

            return NextResponse.json({
                ...session,
                last_message_preview: lastMsg?.message || null,
                last_sender_type: lastMsg?.sender_type || null,
                last_message_id: lastMsg?.id || null
            });
        }

        // Create new session if none exists using Admin client
        const { data: newSession, error: createError } = await supabaseAdmin
            .from('admin_chat_sessions')
            .insert({ franchise_id: parseInt(franchiseId), status: 'open' })
            .select()
            .single();

        if (createError) {
            console.error('Supabase Session Create Error:', createError);
            throw createError;
        }

        return NextResponse.json(newSession);
    } catch (error: any) {
        console.error('Chat Session API Error:', error);
        return NextResponse.json({ error: 'Failed to get session' }, { status: 500 });
    }
}
