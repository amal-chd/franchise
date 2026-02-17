import * as admin from 'firebase-admin';

/**
 * Ensures Firebase Admin is initialized.
 * Returns the default app instance or null if initialization is impossible.
 */
function initAdmin() {
    // If already initialized, return the default app
    if (admin.apps.length > 0) return admin.apps[0];

    // Check for required environment variables
    if (!process.env.FIREBASE_PROJECT_ID) {
        // This is expected during Vercel's static build phase
        if (process.env.NODE_ENV === 'production') {
            console.warn('FIREBASE_PROJECT_ID is missing in production environment');
        }
        return null;
    }

    try {
        const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '')
            .replace(/\\n/g, '\n')
            .replace(/^"(.*)"$/, '$1'); // Remove surrounding quotes

        const app = admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`,
        });

        console.log('Firebase Admin initialized successfully');
        return app;
    } catch (error) {
        console.error('Firebase Admin initialization error:', error);
        return null;
    }
}

// Attempt initial setup on module load
initAdmin();

// Export a proxy for firestore to ensure it's always accessed after initialization
const firestore = new Proxy({} as admin.firestore.Firestore, {
    get(_, prop) {
        const app = initAdmin();
        if (!app) {
            // If we're here, we really need the database but don't have it.
            // Throwing here provides a clearer error than Firebase's "default app" message.
            throw new Error('Firebase Admin not initialized. Check your environment variables (PROJECT_ID, PRIVATE_KEY).');
        }

        const db = admin.firestore();
        const value = (db as any)[prop];
        return typeof value === 'function' ? value.bind(db) : value;
    }
});

function getStorageBucket() {
    const app = initAdmin();
    if (!app) {
        throw new Error('Firebase Admin not initialized. Check your environment variables.');
    }
    return admin.storage().bucket(
        process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`
    );
}

export { firestore, admin, getStorageBucket };
