import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function GET() {
    try {
        const query = `
            ALTER TABLE franchise_requests
            ADD COLUMN password VARCHAR(255) NULL AFTER email;
        `;

        await executeQuery({ query, values: [] });

        return NextResponse.json({ message: 'Migration successful: Added password column' });
    } catch (error: any) {
        return NextResponse.json({ message: 'Migration failed', error: (error as Error).message }, { status: 500 });
    }
}
