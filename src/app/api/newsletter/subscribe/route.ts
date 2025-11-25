import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email || !email.includes('@')) {
            return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
        }

        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        try {
            await connection.execute(
                'INSERT INTO newsletter_subscribers (email) VALUES (?)',
                [email]
            );
            await connection.end();
            return NextResponse.json({ message: 'Subscribed successfully' });
        } catch (error: any) {
            await connection.end();
            if (error.code === 'ER_DUP_ENTRY') {
                return NextResponse.json({ message: 'Email already subscribed' }, { status: 200 });
            }
            throw error;
        }
    } catch (error) {
        console.error('Newsletter subscription error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
