import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function GET() {
    try {
        // Fetch content
        const contentRows = await executeQuery({
            query: 'SELECT * FROM site_content',
            values: []
        });

        // Group content by section and parse JSON
        const content = (contentRows as any[]).reduce((acc, row) => {
            if (!acc[row.section]) {
                acc[row.section] = {};
            }

            let value = row.content_value;
            // Try to parse JSON for arrays/objects
            try {
                if (value && (value.startsWith('[') || value.startsWith('{'))) {
                    value = JSON.parse(value);
                }
            } catch (e) {
                // Keep as string if parse fails
            }

            acc[row.section][row.content_key] = value;
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
            ...settings
        };

        return NextResponse.json(responseData);
    } catch (error: any) {
        console.error('Error fetching site content:', error);
        return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
    }
}
