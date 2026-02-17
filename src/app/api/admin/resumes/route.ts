import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';

// GET all resume submissions
export async function GET() {
    try {
        const snapshot = await firestore.collection('resume_submissions')
            .orderBy('submitted_at', 'desc')
            .get();

        const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            submitted_at: doc.data().submitted_at?.toDate ? doc.data().submitted_at.toDate().toISOString() : doc.data().submitted_at,
        }));

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Resume submissions GET error:', error.message);
        return NextResponse.json([]);
    }
}

// POST a new resume submission
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, phone, message, job_title } = body;

        if (!name || !email) {
            return NextResponse.json({ message: 'Name and email are required' }, { status: 400 });
        }

        await firestore.collection('resume_submissions').add({
            name,
            email,
            phone: phone || '',
            message: message || '',
            job_title: job_title || 'General Application',
            status: 'new',
            submitted_at: new Date(),
        });

        return NextResponse.json({ message: 'Resume submitted successfully' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// DELETE a resume submission
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ message: 'ID is required' }, { status: 400 });
        }

        await firestore.collection('resume_submissions').doc(id).delete();
        return NextResponse.json({ message: 'Submission deleted' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// PATCH to update status
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, status } = body;

        if (!id || !status) {
            return NextResponse.json({ message: 'ID and status are required' }, { status: 400 });
        }

        await firestore.collection('resume_submissions').doc(id).update({ status });
        return NextResponse.json({ message: 'Status updated' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
