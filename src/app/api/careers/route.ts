import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';

export async function GET() {
    try {
        const snapshot = await firestore.collection('careers')
            .orderBy('created_at', 'desc')
            .get();

        // Filter active ones in-memory to avoid needing a Firestore composite index
        const data = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter((doc: any) => doc.is_active !== false);

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Careers GET error:', error.message);
        return NextResponse.json([], { status: 200 });
    }
}
