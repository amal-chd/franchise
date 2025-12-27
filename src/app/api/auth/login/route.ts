import { NextRequest, NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

// Helper function to log activity
async function logActivity(actorId: number, actorType: 'admin' | 'franchise', action: string, request: NextRequest, details?: object) {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    try {
        await executeQuery({
            query: `INSERT INTO activity_logs (actor_id, actor_type, action, details, ip_address) VALUES (?, ?, ?, ?, ?)`,
            values: [actorId, actorType, action, details ? JSON.stringify(details) : null, ip]
        });
    } catch (e) {
        console.error('Activity log error:', e);
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, password } = body;

        // 1. Try Admin Login first
        const ADMIN_USER = 'admin';
        const ADMIN_PASS = 'admin123';

        if (username === ADMIN_USER && password === ADMIN_PASS) {
            // Log admin login
            await logActivity(0, 'admin', 'LOGIN', request, { method: 'credentials' });
            return NextResponse.json({ success: true, role: 'admin' });
        }

        // 2. Try Franchise Login if Admin fails
        const result = await executeQuery({
            query: 'SELECT id, name, email, plan_selected, status, zone_id FROM franchise_requests WHERE (email = ? OR phone = ?) AND password = ? AND status = ?',
            values: [username, username, password, 'approved']
        });

        if (Array.isArray(result) && result.length > 0) {
            const franchise = result[0];
            // Log franchise login
            await logActivity(franchise.id, 'franchise', 'LOGIN', request, { name: franchise.name });
            return NextResponse.json({
                success: true,
                role: 'franchise',
                franchise: franchise
            });
        }

        return NextResponse.json({ success: false, message: 'Invalid credentials or account not active' }, { status: 401 });
    } catch (error: any) {
        console.error('Login Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
