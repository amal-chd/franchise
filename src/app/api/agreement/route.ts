import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { requestId } = body;

        if (!requestId) {
            return NextResponse.json({ message: 'Request ID is required' }, { status: 400 });
        }

        await executeQuery({
            query: 'UPDATE franchise_requests SET agreement_accepted = TRUE, status = ? WHERE id = ?',
            values: ['pending_verification', requestId],
        });

        return NextResponse.json({ message: 'Agreement accepted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Agreement Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
