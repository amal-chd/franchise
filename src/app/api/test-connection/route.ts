import { NextResponse } from 'next/server';
import { admin, firestore } from '@/lib/firebase';

export async function GET() {
    try {
        const apps = admin.apps.length;
        const projectId = process.env.FIREBASE_PROJECT_ID;

        console.log('Testing connectivity...');

        // Attempt a read operation to verify permissions and connection
        // We use a non-existent doc, which should still succeed (return empty) if connected
        const testDoc = await firestore.collection('test_connectivity').doc('ping').get();

        return NextResponse.json({
            status: 'success',
            message: 'Firebase is connected and readable.',
            env: {
                projectId,
                appsInitialized: apps,
                nodeEnv: process.env.NODE_ENV,
            },
            firestore: {
                connected: true,
                exists: testDoc.exists
            }
        });
    } catch (error: any) {
        console.error('Connectivity test failed:', error);

        // analyzing the error to give better feedback
        let refinedError = error.message;
        if (error.code === 5) refinedError = 'Permission Denied (Check Service Account Roles)';
        if (error.message.includes('credential')) refinedError = 'Credential/Private Key Error (Check formatting)';

        return NextResponse.json({
            status: 'error',
            message: refinedError,
            originalError: error.message,
            stack: error.stack,
            env: {
                projectId: process.env.FIREBASE_PROJECT_ID ? 'Set' : 'Missing',
                privateKey: process.env.FIREBASE_PRIVATE_KEY
                    ? `Set (Length: ${process.env.FIREBASE_PRIVATE_KEY.length}, Starts with: ${process.env.FIREBASE_PRIVATE_KEY.substring(0, 10)}...)`
                    : 'Missing',
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? 'Set' : 'Missing',
            }
        }, { status: 500 });
    }
}
