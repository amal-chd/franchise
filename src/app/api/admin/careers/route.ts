import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('careers')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, department, location, type, description, requirements } = body;

        const { error } = await supabase
            .from('careers')
            .insert([{
                title,
                department,
                location,
                type,
                description,
                requirements: requirements || '',
                is_active: true
            }]);

        if (error) throw error;

        return NextResponse.json({ message: 'Job posted successfully' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ message: 'ID is required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('careers')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ message: 'Job deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
