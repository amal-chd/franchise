import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
// import executeQuery from '@/lib/db';

// async function logActivity(actorId: number | string, actorType: 'admin' | 'franchise', action: string, request: NextRequest, details?: object) {
//     // Disable logging to Main DB for now to remove dependency.
//     // const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
//     // try {
//     //     await executeQuery({
//     //         query: `INSERT INTO activity_logs (actor_id, actor_type, action, details, ip_address) VALUES (?, ?, ?, ?, ?)`,
//     //         values: [0, actorType, action, details ? JSON.stringify(details) : null, ip]
//     //     });
//     // } catch (e) {
//     //     console.error('Activity log error:', e);
//     // }
// }

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, password } = body;

        // 1. Try Admin Login (Keep legacy hardcoded for now or migrate to Supabase too)
        const ADMIN_USER = 'admin';
        const ADMIN_PASS = 'admin123';
        if (username === ADMIN_USER && password === ADMIN_PASS) {
            return NextResponse.json({ success: true, role: 'admin' });
        }

        // 2. Try Supabase Auth for Franchise
        // Note: 'username' here is actually email for franchise login based on seed
        const { data, error } = await supabase.auth.signInWithPassword({
            email: username,
            password: password,
        });

        if (error) {
            console.log('Supabase Auth Error:', error.message);
            return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
        }

        if (data.user) {
            // Fetch profile details
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();

            // Return legacy struct for compatibility with Flutter App
            // e.g. "franchise" object with "id" (legacy int id)
            return NextResponse.json({
                success: true,
                role: 'franchise',
                franchise: {
                    id: profile?.franchise_id || 0, // Legacy INT ID
                    uuid: data.user.id, // New UUID
                    name: profile?.username,
                    email: data.user.email,
                    role: profile?.role
                }
            });
        }

        return NextResponse.json({ success: false, message: 'Login failed' }, { status: 401 });
    } catch (error: any) {
        console.error('Login Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
