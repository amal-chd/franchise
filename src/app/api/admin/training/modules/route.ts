
import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    try {
        let query: any = firestore.collection('training_modules').orderBy('created_at', 'desc');

        if (role) {
            query = query.where('role', '==', role);
        }

        const snapshot = await query.get();
        const data = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
            created_at: doc.data().created_at?.toDate ? doc.data().created_at.toDate() : doc.data().created_at
        }));

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error fetching training modules:', error);
        return NextResponse.json({ error: 'Failed to fetch modules' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, description, role, thumbnail_url, category } = body;

        if (!title || !role) {
            return NextResponse.json({ error: 'Title and role are required' }, { status: 400 });
        }

        const docRef = await firestore.collection('training_modules').add({
            title,
            description,
            role,
            thumbnail_url,
            category: category || 'General',
            created_at: new Date()
        });

        const doc = await docRef.get();
        const data = doc.data();

        return NextResponse.json({
            success: true,
            result: { id: docRef.id, ...data }
        });
    } catch (error: any) {
        console.error('Error creating training module:', error);
        return NextResponse.json({ error: 'Failed to create module' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, title, description, role, thumbnail_url, category } = body;

        if (!id || !title || !role) {
            return NextResponse.json({ error: 'ID, Title and role are required' }, { status: 400 });
        }

        await firestore.collection('training_modules').doc(id).update({
            title,
            description,
            role,
            thumbnail_url,
            category: category || 'General',
            updated_at: new Date()
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating training module:', error);
        return NextResponse.json({ error: 'Failed to update module' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    try {
        await firestore.collection('training_modules').doc(id).delete();
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to delete module' }, { status: 500 });
    }
}
