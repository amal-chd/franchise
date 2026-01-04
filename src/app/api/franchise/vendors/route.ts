import { NextResponse } from 'next/server';
import executeQuery from '@/lib/franchise_db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get('zoneId');

    if (!zoneId) {
        return NextResponse.json({ error: 'Zone ID is required' }, { status: 400 });
    }

    try {
        console.log(`DEBUG: Fetching vendors for zoneId: ${zoneId}`);

        // DEBUG: Count total stores to verify DB connection and data existence
        const totalStoresResult: any = await executeQuery({
            query: 'SELECT COUNT(*) as count FROM stores',
            values: []
        });
        console.log(`DEBUG: Total Stores in DB: ${totalStoresResult[0]?.count}`);

        // DEBUG: Count stores for this zone
        const zoneStoresResult: any = await executeQuery({
            query: 'SELECT COUNT(*) as count FROM stores WHERE zone_id = ?',
            values: [zoneId]
        });
        console.log(`DEBUG: Stores in Zone ${zoneId}: ${zoneStoresResult[0]?.count}`);

        // Fetch stores (vendors) for the given zone from READ-ONLY Franchise DB
        const result: any = await executeQuery({
            query: `
                SELECT s.id, s.name, s.logo, s.address, s.phone, s.email, s.active, s.status, s.zone_id, 
                       s.cover_photo, s.rating, s.delivery_time,
                       m.module_name as type
                FROM stores s
                LEFT JOIN modules m ON s.module_id = m.id
                WHERE s.zone_id = ?
            `,
            values: [zoneId],
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Franchise Vendors API Error:', error);
        return NextResponse.json([]); // Return empty list instead of 500
    }
}
