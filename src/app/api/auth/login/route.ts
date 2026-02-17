import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, password } = body;

        // 1. Try Admin Login (Keep legacy hardcoded for now)
        const ADMIN_USER = 'admin';
        const ADMIN_PASS = 'admin123';
        if (username === ADMIN_USER && password === ADMIN_PASS) {
            return NextResponse.json({ success: true, role: 'admin' });
        }

        // 2. Try Franchise Login against Firestore 'franchise_requests'
        // We assume 'username' is email/phone and 'password' is stored in the doc.
        // During migration, password fields should be populated.

        try {
            const snapshot = await firestore.collection('franchise_requests')
                .where('email', '==', username)
                // .where('password', '==', password) // Basic check. 
                // Better to fetch by email and check password in code to handle hashing if applicable
                .limit(1)
                .get();

            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                const data = doc.data();

                // Check password (plain text for now based on legacy migration assumption, or hash check)
                if (data.password === password) {
                    return NextResponse.json({
                        success: true,
                        role: 'franchise',
                        franchise: {
                            id: doc.id, // Use Firestore Doc ID as ID
                            uuid: doc.id, // Same
                            name: data.name,
                            email: data.email,
                            role: 'franchise' // Default role
                        }
                    });
                }
            }
        } catch (dbError) {
            console.error('Firestore Login Check Error:', dbError);
        }

        return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    } catch (error: any) {
        console.error('Login Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
