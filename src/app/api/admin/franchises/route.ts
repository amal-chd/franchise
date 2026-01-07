import { NextResponse } from 'next/server';
import executeFranchiseQuery from '@/lib/franchise_db';
import { logActivity } from '@/lib/activityLogger';

// POST: Create a new franchise (admin with role_id=8)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            name, email, phone, city,
            plan_selected, status,
            zone_id, password
        } = body;

        // Note: Name comes as "Firstname Lastname", need to split
        const nameParts = (name || '').trim().split(' ');
        const f_name = nameParts[0] || '';
        const l_name = nameParts.slice(1).join(' ') || '';

        // Default password hash (placeholder as we lack bcrypt, and login uses Supabase currently)
        // This allows the row to be created if password is NOT NULL.
        // If real auth is needed against this DB, bcrypt is required.
        const passwordHash = '$2y$10$PlaceholderHashForCompability......................';

        const query = `
            INSERT INTO admins (
                f_name, l_name, email, phone, 
                role_id, zone_id, status, 
                password, is_logged_in,
                created_at, updated_at
            ) VALUES (
                ?, ?, ?, ?, 
                8, ?, ?, 
                ?, 0,
                NOW(), NOW()
            )
        `;

        // status: 'approved' -> 1, 'pending' -> 0? 
        // Admin table status is tinyint. Assuming 1=Active
        const dbStatus = status === 'approved' ? 1 : 0;

        const results: any = await executeFranchiseQuery({
            query,
            values: [
                f_name, l_name, email, phone,
                zone_id || null, dbStatus,
                passwordHash
            ]
        });

        if (results.error) {
            throw new Error(results.error.message);
        }

        // Log Activity
        await logActivity({
            actor_id: 1,
            actor_type: 'admin',
            action: 'FRANCHISE_CREATED',
            entity_type: 'franchise',
            entity_id: results.insertId,
            details: { name: `${f_name} ${l_name}`, email, zone_id }
        });

        return NextResponse.json({ success: true, id: results.insertId });
    } catch (error: any) {
        console.error('Create Franchise Error:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}

// PUT: Update franchise details
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const {
            id, name, email, phone,
            zone_id, status
        } = body;

        const nameParts = (name || '').trim().split(' ');
        const f_name = nameParts[0] || '';
        const l_name = nameParts.slice(1).join(' ') || '';

        const dbStatus = status === 'approved' ? 1 : 0;

        const query = `
            UPDATE admins 
            SET 
                f_name = ?, 
                l_name = ?, 
                email = ?, 
                phone = ?, 
                zone_id = ?,
                status = ?,
                updated_at = NOW()
            WHERE id = ? AND role_id = 8
        `;

        const results: any = await executeFranchiseQuery({
            query,
            values: [f_name, l_name, email, phone, zone_id || null, dbStatus, id]
        });

        if (results.error) {
            throw new Error(results.error.message);
        }

        // Log Activity
        await logActivity({
            actor_id: 1,
            actor_type: 'admin',
            action: 'FRANCHISE_UPDATED',
            entity_type: 'franchise',
            entity_id: id,
            details: { name: `${f_name} ${l_name}`, status: status }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Update Franchise Error:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}

// DELETE: Delete a franchise
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ message: 'ID required' }, { status: 400 });
        }

        const query = `DELETE FROM admins WHERE id = ? AND role_id = 8`;
        const results: any = await executeFranchiseQuery({ query, values: [id] });

        if (results.error) {
            throw new Error(results.error.message);
        }

        // Log Activity
        await logActivity({
            actor_id: 1,
            actor_type: 'admin',
            action: 'FRANCHISE_DELETED',
            entity_type: 'franchise',
            entity_id: parseInt(id),
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete Franchise Error:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
