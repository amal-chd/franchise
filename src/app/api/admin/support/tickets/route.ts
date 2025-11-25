import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function GET() {
    try {
        const tickets = await executeQuery({
            query: 'SELECT * FROM support_tickets ORDER BY created_at DESC',
            values: [],
        });

        return NextResponse.json(tickets);
    } catch (error: any) {
        console.error('Fetch Tickets Error:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
