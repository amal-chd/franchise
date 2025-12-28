import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const userId = searchParams.get('userId'); // Exclude self

    if (!query) {
        return NextResponse.json([]);
    }

    try {
        // Search by name, exclude self
        const sql = `
            SELECT id, name as f_name, '' as l_name, NULL as image, 'franchise' as role 
            FROM franchise_requests 
            WHERE name LIKE ? 
            AND id != ?
            LIMIT 20
        `;
        const searchPattern = `%${query}%`;

        const result = await executeQuery({
            query: sql,
            values: [searchPattern, userId || 0]
        });

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
