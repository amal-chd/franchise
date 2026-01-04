import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    try {
        let query = supabase
            .from('training_modules')
            .select('*')
            .order('created_at', { ascending: false });

        if (role) {
            query = query.eq('role', role);
        }

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error fetching training modules:', error);
        return NextResponse.json({ error: 'Failed to fetch modules' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, description, role, thumbnail_url, category } = body;

        if (!title || !role) {
            return NextResponse.json({ error: 'Title and role are required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('training_modules')
            .insert([{
                title,
                description,
                role,
                thumbnail_url,
                category: category || 'General'
            }])
            .select()
            .single();

        if (error) throw error;

        // Return format matching old API expectation roughly, or just the data
        return NextResponse.json({ success: true, result: { insertId: data.id, ...data } });
    } catch (error: any) {
        console.error('Error creating training module:', error);
        return NextResponse.json({ error: 'Failed to create module' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, title, description, role, thumbnail_url, category } = body;

        if (!id || !title || !role) {
            return NextResponse.json({ error: 'ID, Title and role are required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('training_modules')
            .update({
                title,
                description,
                role,
                thumbnail_url,
                category: category || 'General',
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating training module:', error);
        return NextResponse.json({ error: 'Failed to update module' }, { status: 500 });
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
            .from('training_modules')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to delete module' }, { status: 500 });
    }
}

