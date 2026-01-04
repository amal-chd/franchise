import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
    try {
        const { data: rows, error } = await supabase
            .from('site_content')
            .select('*');

        if (error) throw error;

        // Group content by section
        const content = (rows as any[]).reduce((acc, row) => {
            if (!acc[row.section]) {
                acc[row.section] = {};
            }
            acc[row.section][row.content_key] = row.content_value;
            return acc;
        }, {});

        return NextResponse.json(content);
    } catch (error: any) {
        console.error('Error fetching CMS content:', error);
        return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { section, content } = body;

        if (!section || !content) {
            return NextResponse.json({ error: 'Section and content are required' }, { status: 400 });
        }

        // Update or insert content
        for (const [key, value] of Object.entries(content)) {
            const valueToStore = typeof value === 'object' ? JSON.stringify(value) : value;

            const { error } = await supabase
                .from('site_content')
                .upsert({
                    section,
                    content_key: key,
                    content_value: valueToStore
                }, { onConflict: 'section, content_key' });

            if (error) throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating CMS content:', error);
        return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
    }
}
