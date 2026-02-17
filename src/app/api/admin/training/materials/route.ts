
import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');

    if (!moduleId) {
        return NextResponse.json({ error: 'Module ID is required' }, { status: 400 });
    }

    try {
        const snapshot = await firestore.collection('training_materials')
            .where('module_id', '==', moduleId)
            .orderBy('order_index', 'asc')
            .orderBy('created_at', 'asc')
            .get();

        const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error fetching training materials:', error);
        return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { module_id, title, type, content_url, content_text, order_index } = body;

        if (!module_id || !title || !type) {
            return NextResponse.json({ error: 'Module ID, title, and type are required' }, { status: 400 });
        }

        const docRef = await firestore.collection('training_materials').add({
            module_id,
            title,
            type,
            content_url,
            content_text,
            order_index: order_index || 0,
            created_at: new Date()
        });

        const doc = await docRef.get();

        return NextResponse.json({
            success: true,
            result: { id: docRef.id, ...doc.data() }
        });
    } catch (error: any) {
        console.error('Error adding training material:', error);
        return NextResponse.json({ error: 'Failed to add material' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, title, type, content_url, content_text, order_index } = body;

        if (!id || !title || !type) {
            return NextResponse.json({ error: 'ID, title, and type are required' }, { status: 400 });
        }

        await firestore.collection('training_materials').doc(id).update({
            title,
            type,
            content_url,
            content_text,
            order_index: order_index || 0,
            updated_at: new Date()
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating training material:', error);
        return NextResponse.json({ error: 'Failed to update material' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    try {
        await firestore.collection('training_materials').doc(id).delete();
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to delete material' }, { status: 500 });
    }
}
