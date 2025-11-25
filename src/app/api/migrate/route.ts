import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function GET() {
    try {
        // Add the new columns if they don't exist
        await executeQuery({
            query: `
                ALTER TABLE franchise_requests 
                ADD COLUMN IF NOT EXISTS aadhar_url VARCHAR(500),
                ADD COLUMN IF NOT EXISTS agreement_accepted BOOLEAN DEFAULT FALSE,
                ADD COLUMN IF NOT EXISTS rejection_reason TEXT
            `,
            values: [],
        });

        return NextResponse.json({ message: 'Migration completed successfully' }, { status: 200 });
    } catch (error: any) {
        // If columns already exist, that's fine
        if (error.errno === 1060) {
            return NextResponse.json({ message: 'Columns already exist' }, { status: 200 });
        }
        console.error('Migration Error:', error);
        return NextResponse.json({ message: 'Migration failed', error: error.message }, { status: 500 });
    }
}
