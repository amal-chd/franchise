import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function GET() {
    try {
        const content = await executeQuery({
            query: 'SELECT * FROM site_content',
            values: [],
        });

        // Transform array to object for easier frontend consumption
        const contentMap: Record<string, string> = {};
        if (Array.isArray(content)) {
            content.forEach((item: any) => {
                contentMap[item.content_key] = item.content_value;
            });
        }

        return NextResponse.json(contentMap);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
