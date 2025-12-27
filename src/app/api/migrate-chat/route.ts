import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function GET() {
    try {
        await executeQuery({
            query: `
                ALTER TABLE chat_messages 
                ADD COLUMN attachment_url VARCHAR(255) NULL,
                ADD COLUMN attachment_type VARCHAR(50) NULL;
            `,
            values: []
        });
        return NextResponse.json({ success: true, message: 'Chat table migrated' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message });
    }
}
