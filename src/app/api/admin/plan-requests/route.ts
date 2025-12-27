import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function GET() {
    try {
        const requests = await executeQuery({
            query: `
                SELECT 
                    pcr.*,
                    f.name as franchise_name,
                    f.email as franchise_email,
                    f.phone as franchise_phone
                FROM plan_change_requests pcr
                JOIN franchises f ON pcr.franchise_id = f.id
                ORDER BY pcr.created_at DESC
            `,
            values: []
        });
        return NextResponse.json(requests);
    } catch (error: any) {
        console.error('Failed to fetch plan requests:', error);
        return NextResponse.json({ error: 'Failed to fetch plan requests' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { requestId, action } = await req.json();

        if (!requestId || !action || !['approve', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        const rows = (await executeQuery({
            query: 'SELECT * FROM plan_change_requests WHERE id = ?',
            values: [requestId]
        })) as any[];
        const request = rows[0];

        if (!request) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        if (request.status !== 'pending') {
            return NextResponse.json({ error: 'Request is already processed' }, { status: 400 });
        }

        if (action === 'approve') {
            // Update franchise plan
            await executeQuery({
                query: 'UPDATE franchises SET plan_selected = ? WHERE id = ?',
                values: [request.requested_plan, request.franchise_id]
            });

            // Update request status
            await executeQuery({
                query: 'UPDATE plan_change_requests SET status = ? WHERE id = ?',
                values: ['approved', requestId]
            });
        } else {
            // Reject request
            await executeQuery({
                query: 'UPDATE plan_change_requests SET status = ? WHERE id = ?',
                values: ['rejected', requestId]
            });
        }

        return NextResponse.json({ success: true, message: `Request ${action}ed successfully` });
    } catch (error: any) {
        console.error('Failed to process plan request:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
