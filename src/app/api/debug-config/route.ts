import { NextResponse } from 'next/server';

export async function GET() {
    // Only allow this check in development OR with a specific secret if we wanted to be more secure.
    // But since it doesn't expose values, it's relatively safe for debugging.

    const requiredVars = [
        'FIREBASE_PROJECT_ID',
        'FIREBASE_CLIENT_EMAIL',
        'FIREBASE_PRIVATE_KEY',
    ];

    const diagnostics = requiredVars.map(varName => ({
        name: varName,
        isPresent: !!process.env[varName],
        length: process.env[varName]?.length || 0,
        // Don't show the value for security!
    }));

    const otherVars = [
        'FIREBASE_STORAGE_BUCKET',
        'NEXT_PUBLIC_RAZORPAY_KEY_ID',
        'RAZORPAY_KEY_SECRET',
    ];

    const otherDiagnostics = otherVars.map(varName => ({
        name: varName,
        isPresent: !!process.env[varName],
        length: process.env[varName]?.length || 0,
    }));

    return NextResponse.json({
        env: process.env.NODE_ENV,
        diagnostics: [...diagnostics, ...otherDiagnostics],
        timestamp: new Date().toISOString()
    });
}
