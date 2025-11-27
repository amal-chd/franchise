import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');

    if (!moduleId) {
        return NextResponse.json({ error: 'Module ID is required' }, { status: 400 });
    }

    try {
        const result = await executeQuery({
            query: 'SELECT * FROM training_materials WHERE module_id = ? ORDER BY order_index ASC, created_at ASC',
            values: [moduleId]
        });
        return NextResponse.json(result);
    } catch (error) {
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

        const result = await executeQuery({
            query: 'INSERT INTO training_materials (module_id, title, type, content_url, content_text, order_index) VALUES (?, ?, ?, ?, ?, ?)',
            values: [module_id, title, type, content_url, content_text, order_index || 0]
        });

        return NextResponse.json({ success: true, result });
    } catch (error) {
        console.error('Error adding training material:', error);
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, title, type, content_url, content_text, order_index } = body;

        if (!id || !title || !type) {
            return NextResponse.json({ error: 'ID, title, and type are required' }, { status: 400 });
        }

        const result = await executeQuery({
            query: 'UPDATE training_materials SET title = ?, type = ?, content_url = ?, content_text = ?, order_index = ? WHERE id = ?',
            values: [title, type, content_url, content_text, order_index || 0, id]
        });

        return NextResponse.json({ success: true, result });
    } catch (error) {
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
        await executeQuery({
            query: 'DELETE FROM training_materials WHERE id = ?',
            values: [id]
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete material' }, { status: 500 });
    }
}
