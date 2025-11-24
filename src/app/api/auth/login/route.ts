import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        // Hardcoded credentials as requested
        const ADMIN_USER = 'admin';
        const ADMIN_PASS = 'admin123';

        if (username === ADMIN_USER && password === ADMIN_PASS) {
            // In a real app, we would set a secure cookie here.
            // For this simple implementation, we'll just return success and handle state on client.
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
        }
    } catch (error) {
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
