import { NextResponse } from 'next/server';
import { admin, firestore } from '@/lib/firebase';

export async function GET() {
    try {
        let apps = admin.apps.length;
        const projectId = process.env.FIREBASE_PROJECT_ID;

        // If not initialized, try to initialize manually to diagnose
        if (apps === 0) {
            console.log('Admin not initialized. Attempting manual initialization to diagnose...');

            const strategies = [
                {
                    name: 'Standard (replace literal \\n)',
                    fn: (key: string) => key.replace(/\\n/g, '\n').replace(/^"(.*)"$/, '$1')
                },
                {
                    name: 'JSON Parse (if double escaped)',
                    fn: (key: string) => {
                        try { return JSON.parse(`"${key}"`); } catch { return key; }
                    }
                },
                {
                    name: 'Hard Replace (space to newline)',
                    fn: (key: string) => {
                        // Only if it looks like a one-liner with spaces
                        if (!key.includes('\n') && key.includes(' PRIVATE KEY----- ')) {
                            return key.replace(/ -----/g, '\n-----').replace(/----- /g, '-----\n').replace(/\s/g, '\n');
                        }
                        return key;
                    }
                }
            ];

            const rawKey = process.env.FIREBASE_PRIVATE_KEY || '';
            let initSuccess = false;
            let successStrategy = '';

            for (const strategy of strategies) {
                try {
                    console.log(`Attempting strategy: ${strategy.name}`);
                    const privateKey = strategy.fn(rawKey);

                    if (privateKey.length < 50) continue; // Skip invalid results

                    admin.initializeApp({
                        credential: admin.credential.cert({
                            projectId: process.env.FIREBASE_PROJECT_ID,
                            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                            privateKey: privateKey,
                        }),
                        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'the-kada-franchise-assets',
                    }, strategy.name); // unique name per strategy

                    console.log(`Success with strategy: ${strategy.name}`);
                    initSuccess = true;
                    successStrategy = strategy.name;
                    apps = 1; // Mark as success
                    break;
                } catch (err) {
                    console.log(`Failed strategy ${strategy.name}`);
                }
            }

            if (!initSuccess) {
                // Diagnose the raw key format
                const first50 = rawKey.substring(0, 50);
                const charCodes = first50.split('').map(c => c.charCodeAt(0));

                return NextResponse.json({
                    status: 'init_failed',
                    message: 'Firebase Initialization Failed with all strategies',
                    debug: {
                        length: rawKey.length,
                        hasRealNewline: rawKey.includes('\n'),
                        hasLiteralNewline: rawKey.includes('\\n'),
                        hasSpaces: rawKey.includes(' '),
                        first50CharCodes: charCodes,
                        snippet: first50
                    },
                    env: {
                        projectId: process.env.FIREBASE_PROJECT_ID ? 'Set' : 'Missing',
                        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    }
                }, { status: 500 });
            }
        }

        console.log('Testing connectivity...');

        // Attempt a read operation to verify permissions and connection
        const testDoc = await firestore.collection('test_connectivity').doc('ping').get();

        // STORAGE WRITABILITY TEST
        const storageResults: any = {
            configuredBucket: admin.app().options.storageBucket,
            writeConfigured: 'pending',
            writeExplicit: 'pending',
            buckets: []
        };

        try {
            // Access the underlying @google-cloud/storage client
            // admin.storage().bucket() returns a Bucket
            // bucket.storage returns the Storage client
            const gcsClient = admin.storage().bucket().storage;
            const [buckets] = await gcsClient.getBuckets();
            storageResults.buckets = buckets.map((b: any) => b.name || b.id);

            // AUTO-FIX: Try to create a custom bucket if no buckets exist
            if (buckets.length === 0 || storageResults.writeExplicit.includes('404')) {
                try {
                    const newBucketName = `the-kada-franchise-assets`; // Custom name to avoid domain verification
                    // Check if it exists in the list
                    const exists = buckets.find((b: any) => b.name === newBucketName);
                    if (!exists) {
                        storageResults.creationAttempt = `Attempting to create ${newBucketName}...`;
                        await gcsClient.createBucket(newBucketName, {
                            location: 'asia-south1',
                        });
                        storageResults.creationAttempt = 'Success!';

                        // Retry write
                        const explicitBucket = admin.storage().bucket(newBucketName);
                        await explicitBucket.file(`test_write_after_create_${Date.now()}.txt`).save('ping');
                        storageResults.writeAfterCreate = 'success';
                        storageResults.createdBucketName = newBucketName;
                    }
                } catch (err: any) {
                    storageResults.creationAttempt = `Failed: ${err.message}`;
                }
            }

        } catch (e: any) {
            storageResults.buckets = `failed: ${e.message}`;
        }

        try {
            const bucket = admin.storage().bucket(); // uses default
            const file = bucket.file(`test_write_${Date.now()}.txt`);
            await file.save('ping');
            await file.delete();
            storageResults.writeConfigured = 'success';
        } catch (e: any) {
            storageResults.writeConfigured = `failed: ${e.message}`;
        }

        try {
            const explicitBucket = admin.storage().bucket(`${projectId}.appspot.com`);
            const file = explicitBucket.file(`test_write_explicit_${Date.now()}.txt`);
            await file.save('ping');
            await file.delete();
            storageResults.writeExplicit = 'success';
        } catch (e: any) {
            storageResults.writeExplicit = `failed: ${e.message}`;
        }

        return NextResponse.json({
            status: 'success',
            message: 'Firebase is connected and readable.',
            env: {
                projectId,
                appsInitialized: apps,
                nodeEnv: process.env.NODE_ENV,
                storageBucketEnv: process.env.FIREBASE_STORAGE_BUCKET,
            },
            firestore: {
                connected: true,
                exists: testDoc.exists
            },
            storage: storageResults
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
