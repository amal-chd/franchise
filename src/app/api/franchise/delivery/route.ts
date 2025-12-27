import { NextResponse } from 'next/server';
import executeQuery from '@/lib/franchise_db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get('zoneId');

    if (!zoneId) {
        return NextResponse.json({ error: 'Zone ID is required' }, { status: 400 });
    }

    try {
        // Fetch delivery men for the given zone from READ-ONLY Franchise DB
        const result = await executeQuery({
            query: 'SELECT id, f_name, l_name, phone, email, image, status, active, zone_id FROM delivery_men WHERE zone_id = ?',
            values: [zoneId],
        });

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
