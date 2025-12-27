
import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { applicationApprovedEmail } from '@/lib/emailTemplates';
import { sendNotification } from '@/lib/notifications';

// POST: Create a new franchise
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, phone, city, plan_selected, status, upi_id, bank_account_number, ifsc_code, bank_name } = body;

        if (!name || !email || !phone || !city) {
            return NextResponse.json({ message: 'Name, Email, Phone, and City are required' }, { status: 400 });
        }

        const query = `
            INSERT INTO franchise_requests 
            (name, email, phone, city, plan_selected, status, upi_id, bank_account_number, ifsc_code, bank_name, agreement_accepted) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        // Default agreement_accepted to true if admin is creating verified account? Let's keep it false unless specified, or maybe admin creation implies manual override. 
        // Let's assume admin created franchises are "approved" by default usually, but we respect the passed status.
        // We'll set agreement_accepted to true usually for manual overrides, or maybe false depending on process. 
        // Let's set it to false so they might still need to sign? Or if it's admin, maybe we assume it's done offline.
        // Let's passed 'agreement_accepted' as true for now to avoid blocking them if they can't login without it.
        // Actually, let's keep it simple.

        const values = [
            name,
            email,
            phone,
            city,
            plan_selected || 'standard',
            status || 'pending_verification',
            upi_id || null,
            bank_account_number || null,
            ifsc_code || null,
            bank_name || null,
            true // agreement_accepted - assuming admin creation bypasses digital signature flow or is handled offline
        ];

        const result = await executeQuery({ query, values });

        if ((result as any).error) {
            throw new Error((result as any).error);
        }

        return NextResponse.json({ message: 'Franchise added successfully', id: (result as any).insertId }, { status: 201 });
    } catch (error) {
        console.error('Create Franchise Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT: Update an existing franchise
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, name, email, phone, city, plan_selected, status, upi_id, bank_account_number, ifsc_code, bank_name, password, zone_id } = body;

        if (!id) {
            return NextResponse.json({ message: 'Franchise ID is required' }, { status: 400 });
        }

        let query = `
            UPDATE franchise_requests 
            SET name = ?, email = ?, phone = ?, city = ?, plan_selected = ?, status = ?, 
                upi_id = ?, bank_account_number = ?, ifsc_code = ?, bank_name = ?, zone_id = ?
        `;

        const values = [
            name,
            email,
            phone,
            city,
            plan_selected,
            status,
            upi_id || null,
            bank_account_number || null,
            ifsc_code || null,
            bank_name || null,
            zone_id || null
        ];

        if (password && password.trim() !== '') {
            query += `, password = ?`;
            values.push(password);
        }

        query += ` WHERE id = ?`;
        values.push(id);

        const result = await executeQuery({ query, values });

        if ((result as any).error) {
            throw new Error((result as any).error);
        }

        // Trigger notification for status change
        if (status) {
            await sendNotification({
                franchiseId: id,
                title: 'Account Status Updated',
                message: `Your account status has been updated to: ${status}`,
                type: 'franchise',
                data: { status }
            });
        }

        return NextResponse.json({ message: 'Franchise updated successfully' });
    } catch (error) {
        console.error('Update Franchise Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE: Delete a franchise
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ message: 'ID is required' }, { status: 400 });
        }

        const query = 'DELETE FROM franchise_requests WHERE id = ?';
        const result = await executeQuery({ query, values: [id] });

        if ((result as any).error) {
            throw new Error((result as any).error);
        }

        return NextResponse.json({ message: 'Franchise deleted successfully' });
    } catch (error) {
        console.error('Delete Franchise Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
