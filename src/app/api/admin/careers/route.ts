import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function GET() {
    try {
        const careers = await executeQuery({
            query: 'SELECT * FROM careers ORDER BY created_at DESC',
            values: [],
        });
        return NextResponse.json(careers);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, department, location, type, description } = body;

        await executeQuery({
            query: 'INSERT INTO careers (title, department, location, type, description) VALUES (?, ?, ?, ?, ?)',
            values: [title, department, location, type, description],
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

        await executeQuery({
            query: 'DELETE FROM careers WHERE id = ?',
            values: [id],
        });

        return NextResponse.json({ message: 'Job deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
