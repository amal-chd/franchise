import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        // 1. Try Admin Login first
        const ADMIN_USER = 'admin';
        const ADMIN_PASS = 'admin123';

        if (username === ADMIN_USER && password === ADMIN_PASS) {
            return NextResponse.json({ success: true, role: 'admin' });
        }

        // 2. Try Franchise Login if Admin fails
        const result = await executeQuery({
            query: 'SELECT id, name, email, plan_selected, status FROM franchise_requests WHERE (email = ? OR phone = ?) AND password = ? AND status = ?',
            values: [username, username, password, 'approved']
        });

        if (Array.isArray(result) && result.length > 0) {
            const franchise = result[0];
            return NextResponse.json({
                success: true,
                role: 'franchise',
                franchise: franchise
            });
        }

        return NextResponse.json({ success: false, message: 'Invalid credentials or account not active' }, { status: 401 });
    } catch (error) {
        console.error('Login Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
