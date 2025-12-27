import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email || !email.includes('@')) {
            return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
        }

        try {
            await executeQuery({
                query: 'INSERT INTO newsletter_subscribers (email) VALUES (?)',
                values: [email]
            });
            return NextResponse.json({ message: 'Subscribed successfully' });
        } catch (error: any) {
            if (error.code === 'ER_DUP_ENTRY' || error.message?.includes('Duplicate entry')) {
                return NextResponse.json({ message: 'Email already subscribed' }, { status: 200 });
            }
            throw error;
        }
    } catch (error: any) {
        console.error('Newsletter subscription error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
