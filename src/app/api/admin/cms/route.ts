import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';


export async function GET() {
    try {
        const snapshot = await firestore.collection('site_content').get();
        const rows = snapshot.docs.map((doc: any) => doc.data());

        // Group content by section
        const content = rows.reduce((acc: any, row: any) => {
            if (!acc[row.section]) {
                acc[row.section] = {};
            }
            acc[row.section][row.content_key] = row.content_value;
            return acc;
        }, {});

        return NextResponse.json(content);
    } catch (error: any) {
        console.error('Error fetching CMS content:', error);
        return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { section, content } = body;

        if (!section || !content) {
            return NextResponse.json({ error: 'Section and content are required' }, { status: 400 });
        }

        // Update or insert content
        const batch = firestore.batch();

        for (const [key, value] of Object.entries(content)) {
            const valueToStore = typeof value === 'object' ? JSON.stringify(value) : value;

            // Create a unique ID or use a combination of section-key to enforce uniqueness if desired.
            // Here, we query for existing document to update or create new.
            // To make it efficient, let's use a deterministic ID: `${section}_${key}`
            const docId = `${section}_${key}`;
            const docRef = firestore.collection('site_content').doc(docId);

            batch.set(docRef, {
                section,
                content_key: key,
                content_value: valueToStore,
                updated_at: new Date()
            }, { merge: true });
        }

        await batch.commit();

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating CMS content:', error);
        return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
    }
}
