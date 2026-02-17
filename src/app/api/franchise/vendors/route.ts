import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get('zoneId');

    if (!zoneId) {
        return NextResponse.json({ error: 'Zone ID is required' }, { status: 400 });
    }

    try {
        console.log(`DEBUG: Fetching vendors for zoneId: ${zoneId}`);

        // Fetch vendors/stores for the given zone from Firestore collection 'vendors'
        const snapshot = await firestore.collection('vendors')
            .where('zone_id', '==', parseInt(zoneId) || zoneId)
            .get();

        const result = snapshot.docs.map((doc: any) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Ensure fields match frontend expectations
                type: data.type || data.module_name || 'Store'
            };
        });

        console.log(`DEBUG: Stores in Zone ${zoneId}: ${result.length}`);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Franchise Vendors API Error:', error);
        return NextResponse.json([]); // Return empty list instead of 500
    }
}
