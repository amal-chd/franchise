import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function GET() {
    try {
        const result = await executeQuery({
            query: 'SELECT * FROM newsletter_subscribers ORDER BY subscribed_at DESC'
        });
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error fetching subscribers:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
