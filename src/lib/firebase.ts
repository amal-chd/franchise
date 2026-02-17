import * as admin from 'firebase-admin';

if (!admin.apps.length && process.env.FIREBASE_PROJECT_ID) {
    try {
        const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '')
            .replace(/\\n/g, '\n')
            .replace(/^"(.*)"$/, '$1'); // Remove surrounding quotes if they exist

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`,
        });
        console.log('Firebase Admin initialized successfully');
    } catch (error) {
        console.error('Firebase Admin initialization error:', error);
    }
}

// Export a proxy for firestore to ensure it's always accessed after initialization
// and doesn't hold a null value from build-time module evaluation
const firestore = new Proxy({} as admin.firestore.Firestore, {
    get(_, prop) {
        if (!admin.apps.length) {
            console.warn('Accessing Firestore before Firebase Admin is initialized');
            // If we're in build phase, this might be fine as long as we don't call it.
            // If we're at runtime, this is an error.
        }
        const db = admin.firestore();
        const value = (db as any)[prop];
        return typeof value === 'function' ? value.bind(db) : value;
    }
});

function getStorageBucket() {
    if (!admin.apps.length) {
        throw new Error('Firebase Admin not initialized. Check your environment variables.');
    }
    return admin.storage().bucket(
        process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`
    );
}

export { firestore, admin, getStorageBucket };
