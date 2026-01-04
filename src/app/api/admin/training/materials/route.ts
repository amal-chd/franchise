import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');

    if (!moduleId) {
        return NextResponse.json({ error: 'Module ID is required' }, { status: 400 });
    }

    try {
        const { data, error } = await supabase
            .from('training_materials')
            .select('*')
            .eq('module_id', moduleId)
            .order('order_index', { ascending: true })
            .order('created_at', { ascending: true });

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error fetching training materials:', error);
        return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { module_id, title, type, content_url, content_text, order_index } = body;

        if (!module_id || !title || !type) {
            return NextResponse.json({ error: 'Module ID, title, and type are required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('training_materials')
            .insert([{
                module_id,
                title,
                type,
                content_url,
                content_text,
                order_index: order_index || 0
            }])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, result: { insertId: data.id, ...data } });
    } catch (error: any) {
        console.error('Error adding training material:', error);
        return NextResponse.json({ error: 'Failed to add material' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, title, type, content_url, content_text, order_index } = body;

        if (!id || !title || !type) {
            return NextResponse.json({ error: 'ID, title, and type are required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('training_materials')
            .update({
                title,
                type,
                content_url,
                content_text,
                order_index: order_index || 0,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating training material:', error);
        return NextResponse.json({ error: 'Failed to update material' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    try {
        const { error } = await supabase
            .from('training_materials')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to delete material' }, { status: 500 });
    }
}

