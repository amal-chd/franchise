import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function GET() {
    try {
        // Total Requests
        const totalRequestsResult = await executeQuery({
            query: 'SELECT COUNT(*) as count FROM franchise_requests',
            values: [],
        }) as any[];
        const totalRequests = totalRequestsResult[0].count;

        // Pending Verification
        const pendingVerificationResult = await executeQuery({
            query: 'SELECT COUNT(*) as count FROM franchise_requests WHERE status = ?',
            values: ['pending_verification'],
        }) as any[];
        const pendingVerification = pendingVerificationResult[0].count;

        // Active Franchises (Approved)
        const activeFranchisesResult = await executeQuery({
            query: 'SELECT COUNT(*) as count FROM franchise_requests WHERE status = ?',
            values: ['approved'],
        }) as any[];
        const activeFranchises = activeFranchisesResult[0].count;

        // Revenue (Estimated based on plan)
        // Assuming 'basic' is 5000 and 'premium' is 10000. 'free' is 0.
        // We need to check the 'plan' column if it exists, or infer from payment data if available.
        // For now, let's assume we can query based on plan if the column exists.
        // If not, we might need to add it or just count approved * avg.
        // Let's check if 'plan' column exists in previous steps or just use a placeholder.
        // The apply page sends 'plan' to create-order, but does it save to franchise_requests?
        // Let's assume for now we just count.

        // Actually, let's just return what we have.

        // Pending Tickets (Open)
        const pendingTicketsResult = await executeQuery({
            query: 'SELECT COUNT(*) as count FROM support_tickets WHERE status IS NULL OR status = ?',
            values: ['open'],
        }) as any[];
        const pendingTickets = pendingTicketsResult[0].count;

        // Replied Tickets
        const repliedTicketsResult = await executeQuery({
            query: 'SELECT COUNT(*) as count FROM support_tickets WHERE status = ?',
            values: ['replied'],
        }) as any[];
        const repliedTickets = repliedTicketsResult[0].count;

        return NextResponse.json({
            totalRequests,
            pendingVerification,
            activeFranchises,
            pendingTickets,
            repliedTickets
        });

    } catch (error: any) {
        console.error('Analytics API Error:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
