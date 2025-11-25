import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        const [rows] = await connection.execute(
            'SELECT * FROM newsletter_subscribers ORDER BY subscribed_at DESC'
        );

        await connection.end();
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Error fetching subscribers:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
