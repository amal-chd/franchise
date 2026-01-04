import { NextResponse } from 'next/server';
import executeFranchiseQuery from '@/lib/franchise_db';

export async function GET() {
    try {
        const query = `
            SELECT 
                a.id, 
                CONCAT(a.f_name, ' ', a.l_name) as name, 
                a.email, 
                a.phone, 
                z.name as city, 
                'approved' as status, 
                'standard' as plan_selected,
                a.zone_id
            FROM admins a
            LEFT JOIN zones z ON a.zone_id = z.id
            WHERE a.role_id = 8
            ORDER BY a.created_at DESC
        `;
        const results: any = await executeFranchiseQuery({ query });

        if (results.error) {
            throw new Error(results.error.message || 'Database error');
        }

        // Return array directly as per provider expectation
        return NextResponse.json(results);
    } catch (error: any) {
        console.error('Fetch Requests Error:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
