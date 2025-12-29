import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const userId = searchParams.get('userId'); // Exclude self

    if (!query) {
        return NextResponse.json([]);
    }

    try {
        // Search by name, exclude self
        // Search by name, exclude self, include friendship status
        const sql = `
            SELECT 
                u.id, 
                u.name as f_name, 
                '' as l_name, 
                u.city as location,
                NULL as image, 
                'franchise' as role,
                CASE 
                    WHEN f1.status = 'accepted' OR f2.status = 'accepted' THEN 'friend'
                    WHEN f1.status = 'pending' THEN 'sent'
                    WHEN f2.status = 'pending' THEN 'received'
                    ELSE 'none'
                END as friendship_status
            FROM franchise_requests u
            LEFT JOIN friendships f1 ON f1.user_id = ? AND f1.friend_id = u.id
            LEFT JOIN friendships f2 ON f2.user_id = u.id AND f2.friend_id = ?
            WHERE u.name LIKE ? 
            AND u.id != ?
            LIMIT 20
        `;
        const searchPattern = `%${query}%`;
        const currentUserId = userId || 0;

        const result = await executeQuery({
            query: sql,
            values: [currentUserId, currentUserId, searchPattern, currentUserId]
        });

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
