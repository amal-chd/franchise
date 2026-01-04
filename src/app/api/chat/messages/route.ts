import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
        return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    try {
        const { data: messages, error } = await supabase
            .from('admin_chats')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return NextResponse.json(messages);
    } catch (error: any) {
        console.error('Fetch Messages Error:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { sessionId, senderType, senderId, message, attachmentUrl, attachmentType } = body;

        if (!sessionId || (!message && !attachmentUrl)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Insert into admin_chats
        const { error: insertError } = await supabase
            .from('admin_chats')
            .insert([{
                session_id: sessionId,
                sender_type: senderType,
                // sender_id is not in admin_chats schema based on inspection, standardizing on sender_type
                // If sender_id is needed, we should add it, but mobile app doesn't seem to use it for admin_chats
                message: message || '',
                attachment_url: attachmentUrl || null,
                attachment_type: attachmentType || null
            }]);

        if (insertError) throw insertError;

        // Update session last_message
        const lastMsg = message || (attachmentType === 'image' ? 'Image' : 'File');
        const { error: updateError } = await supabase
            .from('admin_chat_sessions')
            .update({
                last_message: lastMsg,
                last_message_time: new Date().toISOString()
            })
            .eq('id', sessionId);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Send Message Error:', error);
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }
}
