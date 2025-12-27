
import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function GET() {
    try {
        const alterQuery = `
            ALTER TABLE franchise_requests
            ADD COLUMN IF NOT EXISTS upi_id VARCHAR(100),
            ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(100),
            ADD COLUMN IF NOT EXISTS ifsc_code VARCHAR(50),
            ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
        `;

        await executeQuery({
            query: alterQuery,
            values: [],
        });

        return NextResponse.json({ message: 'Database schema updated successfully: Added banking columns.' });
    } catch (error: any) {
        console.error('Migration Error:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
