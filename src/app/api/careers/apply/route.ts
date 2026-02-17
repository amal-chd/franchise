import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';

// Public endpoint for resume submissions
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, phone, message, job_title, resume_url } = body;

        if (!name || !email) {
            return NextResponse.json({ message: 'Name and email are required' }, { status: 400 });
        }

        await firestore.collection('resume_submissions').add({
            name,
            email,
            phone: phone || '',
            message: message || '',
            job_title: job_title || 'General Application',
            resume_url: resume_url || '',
            status: 'new',
            submitted_at: new Date(),
        });

        return NextResponse.json({ message: 'Resume submitted successfully' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
