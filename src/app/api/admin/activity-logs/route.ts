import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';
// import executeQuery from '@/lib/db';

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

        let query: any = firestore.collection('activity_logs');

        if (actorType) {
            query = query.where('actor_type', '==', actorType);
        }

        if (actorId) {
            query = query.where('actor_id', '==', parseInt(actorId)); // specific actor
        }

        if (action) {
            query = query.where('action', '==', action);
        }

        if (startDate) {
            query = query.where('created_at', '>=', new Date(startDate));
        }

        if (endDate) {
            query = query.where('created_at', '<=', new Date(endDate + ' 23:59:59'));
        }

        // Apply ordering (requires index)
        try {
            query = query.orderBy('created_at', 'desc');
        } catch (e) {
            console.warn('Firestore ordering requires index, fallback to default order or fetch all');
        }

        const snapshot = await query.get();
        const allLogs = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

        const total = allLogs.length;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const logs = allLogs.slice(startIndex, endIndex);


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

        const docRef = await firestore.collection('activity_logs').add({
            actor_id,
            actor_type,
            action,
            entity_type: entity_type || null,
            entity_id: entity_id || null,
            details: details || null,
            ip_address,
            created_at: new Date()
        });

        return NextResponse.json({
            success: true,
            id: docRef.id,
            message: 'Activity logged successfully'
        });
    } catch (error: any) {
        console.error('Activity Logs POST Error:', error);
        return NextResponse.json({ error: 'Failed to create activity log' }, { status: 500 });
    }
}
