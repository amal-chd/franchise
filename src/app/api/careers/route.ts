import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function GET() {
    try {
        const careers = await executeQuery({
            query: 'SELECT * FROM careers ORDER BY created_at DESC',
            values: [],
        });
        return NextResponse.json(careers);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
