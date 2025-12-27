import { NextRequest, NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

// GET: Fetch activity logs with pagination and filters
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const actorType = searchParams.get('actor_type'); // 'admin' or 'franchise'
        const action = searchParams.get('action');
        const startDate = searchParams.get('start_date');
        const endDate = searchParams.get('end_date');
        const actorId = searchParams.get('actor_id');

        const offset = (page - 1) * limit;

        let whereConditions: string[] = [];
        let params: any[] = [];

        if (actorType) {
            whereConditions.push('actor_type = ?');
            params.push(actorType);
        }

        if (actorId) {
            whereConditions.push('actor_id = ?');
            params.push(parseInt(actorId));
        }

        if (action) {
            whereConditions.push('action = ?');
            params.push(action);
        }

        if (startDate) {
            whereConditions.push('created_at >= ?');
            params.push(startDate);
        }

        if (endDate) {
            whereConditions.push('created_at <= ?');
            params.push(endDate + ' 23:59:59');
        }

        const whereClause = whereConditions.length > 0
            ? 'WHERE ' + whereConditions.join(' AND ')
            : '';

        // Get total count
        const countResult = await executeQuery({
            query: `SELECT COUNT(*) as total FROM activity_logs ${whereClause}`,
            values: params
        }) as any[];

        const total = countResult[0]?.total || 0;

        // Get paginated logs
        const logs = await executeQuery({
            query: `
        SELECT 
          id,
          actor_id,
          actor_type,
          action,
          entity_type,
          entity_id,
          details,
          ip_address,
          created_at
        FROM activity_logs 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `,
            values: [...params, limit, offset]
        });

        return NextResponse.json({
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        console.error('Activity Logs GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
    }
}

// POST: Create a new activity log entry
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { actor_id, actor_type, action, entity_type, entity_id, details } = body;

        if (!actor_id || !actor_type || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get IP address from request headers
        const ip_address = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';

        const result = await executeQuery({
            query: `
        INSERT INTO activity_logs (actor_id, actor_type, action, entity_type, entity_id, details, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
            values: [
                actor_id,
                actor_type,
                action,
                entity_type || null,
                entity_id || null,
                details ? JSON.stringify(details) : null,
                ip_address
            ]
        }) as any;

        return NextResponse.json({
            success: true,
            id: result.insertId,
            message: 'Activity logged successfully'
        });
    } catch (error: any) {
        console.error('Activity Logs POST Error:', error);
        return NextResponse.json({ error: 'Failed to create activity log' }, { status: 500 });
    }
}
