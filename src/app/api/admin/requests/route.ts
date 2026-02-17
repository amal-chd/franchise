import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';

export async function GET() {
    try {
        const snapshot = await firestore.collection('franchise_requests')
            .orderBy('created_at', 'desc')
            .get();

        const requests = snapshot.docs
            .map((doc: any) => ({
                id: doc.id,
                ...doc.data()
            }))
            .filter((req: any) => {
                // Filter logic:
                // 1. Must NOT have a password field (excludes app registrations)
                // 2. If source is present, it should be 'web_onboarding' (or maybe 'admin_manual' if we want those too, but user said "from main web")
                //    Let's be safe and just filter out the "password" ones for now as that's the clear differentiator for "accounts" vs "requests".
                //    Web requests don't have passwords. App registrations do.
                return !req.password;
            });

        return NextResponse.json(requests);
    } catch (error: any) {
        console.error('Fetch Requests Error:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
