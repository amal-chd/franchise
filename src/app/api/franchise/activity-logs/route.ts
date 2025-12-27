import { NextRequest, NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

// GET: Fetch activity logs for a specific franchise
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const franchiseId = searchParams.get('franchiseId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const action = searchParams.get('action');
        const startDate = searchParams.get('start_date');
        const endDate = searchParams.get('end_date');

        if (!franchiseId) {
            return NextResponse.json({ error: 'franchiseId is required' }, { status: 400 });
        }

        const offset = (page - 1) * limit;

        let whereConditions: string[] = ['actor_type = ?', 'actor_id = ?'];
        let params: any[] = ['franchise', parseInt(franchiseId)];

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

        const whereClause = 'WHERE ' + whereConditions.join(' AND ');

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
        console.error('Franchise Activity Logs GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
    }
}
