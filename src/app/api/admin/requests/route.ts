import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function GET() {
    try {
        const results = await executeQuery({
            query: 'SELECT * FROM franchise_requests ORDER BY created_at DESC',
        });

        if ((results as any).error) {
            throw new Error((results as any).error);
        }

        return NextResponse.json(results);
    } catch (error: any) {
        console.error('Fetch Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
