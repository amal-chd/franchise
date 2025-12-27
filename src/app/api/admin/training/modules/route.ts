import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    let query = 'SELECT * FROM training_modules';
    const values = [];

    if (role) {
        query += ' WHERE role = ?';
        values.push(role);
    }

    query += ' ORDER BY created_at DESC';

    try {
        const result = await executeQuery({ query, values });
        return NextResponse.json(result);
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

        const result = await executeQuery({
            query: 'INSERT INTO training_modules (title, description, role, thumbnail_url, category) VALUES (?, ?, ?, ?, ?)',
            values: [title, description, role, thumbnail_url, category || 'General']
        });

        return NextResponse.json({ success: true, result });
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

        const result = await executeQuery({
            query: 'UPDATE training_modules SET title = ?, description = ?, role = ?, thumbnail_url = ?, category = ? WHERE id = ?',
            values: [title, description, role, thumbnail_url, category || 'General', id]
        });

        return NextResponse.json({ success: true, result });
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
        await executeQuery({
            query: 'DELETE FROM training_modules WHERE id = ?',
            values: [id]
        });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to delete module' }, { status: 500 });
    }
}
