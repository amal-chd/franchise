import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email || !email.includes('@')) {
            return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
        }

        try {
            // Check for duplicate
            const snapshot = await firestore.collection('newsletter_subscribers')
                .where('email', '==', email)
                .get();

            if (!snapshot.empty) {
                return NextResponse.json({ message: 'Email already subscribed' }, { status: 200 });
            }

            await firestore.collection('newsletter_subscribers').add({
                email,
                status: 'active',
                subscribed_at: new Date()
            });

            return NextResponse.json({ message: 'Subscribed successfully' });
        } catch (error: any) {
            throw error;
        }
    } catch (error: any) {
        console.error('Newsletter subscription error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
