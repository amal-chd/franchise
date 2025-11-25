import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function GET() {
    try {
        const content = await executeQuery({
            query: 'SELECT * FROM site_content',
            values: [],
        });

        // Transform array to object for easier frontend consumption
        const contentMap: Record<string, any> = {};
        if (Array.isArray(content)) {
            content.forEach((item: any) => {
                // Parse JSON content types
                if (item.content_type === 'json') {
                    try {
                        contentMap[item.content_key] = JSON.parse(item.content_value);
                    } catch (e) {
                        contentMap[item.content_key] = item.content_value;
                    }
                } else {
                    contentMap[item.content_key] = item.content_value;
                }
            });
        }

        return NextResponse.json(contentMap);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { updates } = body; // Expecting an object { key: value, key2: value2 }

        if (!updates || typeof updates !== 'object') {
            return NextResponse.json({ message: 'Invalid updates format' }, { status: 400 });
        }

        for (const [key, value] of Object.entries(updates)) {
            // Stringify if value is an object or array
            const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
            const contentType = typeof value === 'object' ? 'json' : 'text';

            await executeQuery({
                query: `INSERT INTO site_content (content_key, content_value, content_type) VALUES (?, ?, ?) 
                        ON DUPLICATE KEY UPDATE content_value = ?, content_type = ?`,
                values: [key, stringValue, contentType, stringValue, contentType],
            });
        }

        return NextResponse.json({ message: 'Content updated successfully' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
