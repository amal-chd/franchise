import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, moduleId, materialIds, progress, isCompleted } = body;

        if (!userId || !moduleId) {
            return NextResponse.json({ error: 'UserId and ModuleId required' }, { status: 400 });
        }

        const materialIdsJson = JSON.stringify(materialIds || []);

        const query = `
            INSERT INTO training_progress (user_id, module_id, material_ids_json, progress, is_completed)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            material_ids_json = VALUES(material_ids_json),
            progress = VALUES(progress),
            is_completed = VALUES(is_completed),
            updated_at = CURRENT_TIMESTAMP
        `;

        await executeQuery({
            query,
            values: [userId, moduleId, materialIdsJson, progress || 0, isCompleted ? 1 : 0]
        });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("Progress Update Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'UserId required' }, { status: 400 });
    }

    try {
        const result = await executeQuery({
            query: 'SELECT * FROM training_progress WHERE user_id = ?',
            values: [userId]
        });
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
