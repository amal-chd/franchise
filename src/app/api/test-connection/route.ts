import { NextResponse } from 'next/server';
import { admin, firestore } from '@/lib/firebase';

export async function GET() {
    try {
        let apps = admin.apps.length;
        const projectId = process.env.FIREBASE_PROJECT_ID;

        // If not initialized, try to initialize manually to capture the specific error
        if (apps === 0) {
            console.log('Admin not initialized. Attempting manual initialization to diagnose...');
            try {
                const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '')
                    .replace(/\\n/g, '\n')
                    .replace(/^"(.*)"$/, '$1');

                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId: process.env.FIREBASE_PROJECT_ID,
                        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                        privateKey: privateKey,
                    }),
                    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`,
                });
                console.log('Manual initialization successful');
                apps = admin.apps.length; // Update count
            } catch (initErr: any) {
                console.error('Manual initialization failed:', initErr);
                return NextResponse.json({
                    status: 'init_failed',
                    message: 'Firebase Initialization Failed',
                    error: initErr.message,
                    code: initErr.code,
                    stack: initErr.stack,
                    env: {
                        projectId: process.env.FIREBASE_PROJECT_ID ? 'Set' : 'Missing',
                        // Show first 20 chars of key to verify header
                        privateKeyStart: process.env.FIREBASE_PRIVATE_KEY
                            ? process.env.FIREBASE_PRIVATE_KEY.substring(0, 30)
                            : 'Missing',
                        privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length,
                        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    }
                }, { status: 500 });
            }
        }

        console.log('Testing connectivity...');

        // Attempt a read operation to verify permissions and connection
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
