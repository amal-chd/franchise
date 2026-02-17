
import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';

export async function GET() {
    try {
        const snapshot = await firestore.collection('careers')
            .orderBy('created_at', 'desc')
            .get();

        const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Ensure dates are converted if needed for frontend
            created_at: doc.data().created_at?.toDate ? doc.data().created_at.toDate() : doc.data().created_at
        }));

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, department, location, type, description, requirements } = body;

        await firestore.collection('careers').add({
            title,
            department,
            location,
            type,
            description,
            requirements: requirements || '',
            is_active: true,
            created_at: new Date()
        });

        return NextResponse.json({ message: 'Job posted successfully' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ message: 'ID is required' }, { status: 400 });
        }

        await firestore.collection('careers').doc(id).delete();

        return NextResponse.json({ message: 'Job deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
