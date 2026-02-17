import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function GET() {
    try {
        // Firestore is schemaless, so explicit table creation is not needed.
        // We can just return success or init some default collections if really needed.

        return NextResponse.json({ success: true, message: 'Training tables setup successfully (Firestore: No schema needed)' });
    } catch (error: any) {
        console.error('Error setting up training DB:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
