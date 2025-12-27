import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function GET() {
    try {
        const rows = await executeQuery({
            query: 'SELECT * FROM site_content',
            values: []
        });

        // Group content by section
        const content = (rows as any[]).reduce((acc, row) => {
            if (!acc[row.section]) {
                acc[row.section] = {};
            }
            acc[row.section][row.content_key] = row.content_value;
            return acc;
        }, {});

        return NextResponse.json(content);
    } catch (error) {
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
            await executeQuery({
                query: `
                    INSERT INTO site_content (section, content_key, content_value)
                    VALUES (?, ?, ?)
                    ON DUPLICATE KEY UPDATE content_value = ?
                `,
                values: [section, key, valueToStore, valueToStore]
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating CMS content:', error);
        return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
    }
}
