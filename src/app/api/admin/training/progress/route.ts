import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, moduleId, materialIds, progress, isCompleted } = body;

        if (!userId || !moduleId) {
            return NextResponse.json({ error: 'UserId and ModuleId required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('training_progress')
            .upsert({
                user_id: userId,
                module_id: moduleId,
                material_ids_json: materialIds || [],
                progress: progress || 0,
                is_completed: isCompleted ? true : false,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id, module_id' });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("Progress Update Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'UserId required' }, { status: 400 });
    }

    try {
        const { data, error } = await supabase
            .from('training_progress')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;

        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
