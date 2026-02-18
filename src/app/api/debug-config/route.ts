import { NextResponse } from 'next/server';

export async function GET() {
    const requiredVars = [
        'FIREBASE_PROJECT_ID',
        'FIREBASE_CLIENT_EMAIL',
        'FIREBASE_PRIVATE_KEY',
        'FIREBASE_STORAGE_BUCKET',
    ];

    const diagnostics = requiredVars.map(varName => {
        const val = process.env[varName] || '';
        return {
            name: varName,
            isPresent: !!val,
            length: val.length,
            // Prefix helps verify it's the right project/email without exposing secrets
            prefix: val.substring(0, 10),
            // Check for common formatting issues
            hasActualNewlines: val.includes('\n'),
            hasEscapedNewlines: val.includes('\\n'),
            startsWithBegin: val.includes('BEGIN PRIVATE KEY'),
        };
    });

    return NextResponse.json({
        env: process.env.NODE_ENV,
        diagnostics,
        timestamp: new Date().toISOString(),
        help: "If all isPresent are false, ensure you added them to Vercel and REDEPLOYED the project."
    });
}
