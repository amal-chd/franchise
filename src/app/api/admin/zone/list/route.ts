import { NextResponse } from 'next/server';
import executeQuery from '@/lib/franchise_db';

export async function GET(request: Request) {
    try {
        // Fetch all active zones from the READ-ONLY Franchise DB
        // Assuming 'zones' table exists with 'id', 'name', 'status'
        const result = await executeQuery({
            query: 'SELECT id, name FROM zones WHERE status = 1',
            values: [],
        });

        console.log('DEBUG: Zones Query Result:', result);
        console.log('DEBUG: Zones Count:', Array.isArray(result) ? result.length : 'Not an array');

        return NextResponse.json(result);
    } catch (error) {
        console.error('Zone Fetch Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
