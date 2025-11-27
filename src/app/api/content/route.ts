import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function GET() {
    try {
        // Fetch content
        const contentRows = await executeQuery({
            query: 'SELECT * FROM site_content',
            values: []
        });

        // Group content by section
        const content = (contentRows as any[]).reduce((acc, row) => {
            if (!acc[row.section]) {
                acc[row.section] = {};
            }
            acc[row.section][row.content_key] = row.content_value;
            return acc;
        }, {});

        // Fetch settings
        const settingsRows = await executeQuery({
            query: 'SELECT * FROM site_settings',
            values: []
        });

        const settings = (settingsRows as any[]).reduce((acc, row) => {
            acc[row.setting_key] = row.setting_value;
            return acc;
        }, {});

        // Combine
        const responseData = {
            ...content,
            settings
        };

        return NextResponse.json(responseData);
    } catch (error) {
        console.error('Error fetching site content:', error);
        return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
    }
}
