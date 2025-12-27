import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { franchiseId, currentPlan, requestedPlan } = body;

        await executeQuery({
            query: 'INSERT INTO plan_change_requests (franchise_id, current_plan, requested_plan) VALUES (?, ?, ?)',
            values: [franchiseId, currentPlan, requestedPlan]
        });

        return NextResponse.json({ success: true, message: 'Request submitted' });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
    }
}
