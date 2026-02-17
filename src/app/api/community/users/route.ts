import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const userId = searchParams.get('userId'); // Requester ID (Legacy INT or Firestore ID)

    if (!query) {
        return NextResponse.json([]);
    }

    try {
        // Basic search implementation for Firestore (prefix search)
        // Note: Firestore doesn't support full-text search natively without third-party like Algolia.
        // using >= and <= for prefix match on 'name'.

        const snapshot = await firestore.collection('franchise_requests')
            .where('name', '>=', query)
            .where('name', '<=', query + '\uf8ff')
            .limit(20)
            .get();

        const users: any[] = [];
        snapshot.forEach((doc: any) => {
            const data = doc.data();
            // Filter out the requester themselves if needed
            if (doc.id !== userId) {
                users.push({
                    id: doc.id, // Use Firestore ID
                    f_name: data.name,
                    l_name: '', // legacy field
                    location: data.city,
                    image: data.profile_image || null,
                    role: 'franchise',
                    friendship_status: null // TODO: Determine friendship status if possible, or handle on frontend
                });
            }
        });

        // Optionally fetch friendship status if userId is provided
        // This is expensive in NoSQL without a dedicated graph or denormalization.
        // For now returning null status, frontend might need to fetch separately or we assume 'none'.

        return NextResponse.json(users);
    } catch (error: any) {
        console.error('Search users error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
