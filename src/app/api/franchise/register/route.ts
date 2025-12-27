import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';
import { sendNotification } from '@/lib/notifications';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            name, email, phone, city, password,
            upi_id, bank_account_number, ifsc_code, bank_name
        } = body;

        if (!name || !email || !phone || !city || !password) {
            return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
        }

        // Check if email or phone already exists
        const checkQuery = 'SELECT id FROM franchise_requests WHERE email = ? OR phone = ?';
        const checkResult = await executeQuery({ query: checkQuery, values: [email, phone] });

        if ((checkResult as any[]).length > 0) {
            return NextResponse.json({ message: 'Email or Phone already registered' }, { status: 409 });
        }

        const query = `
            INSERT INTO franchise_requests 
            (name, email, phone, city, password, plan_selected, status, agreement_accepted, budget, upi_id, bank_account_number, ifsc_code, bank_name) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            name,
            email,
            phone,
            city,
            password,
            'free', // Default plan
            'pending_verification', // Default status
            false, // Must accept agreement later
            'Standard',
            upi_id || null,
            bank_account_number || null,
            ifsc_code || null,
            bank_name || null
        ];

        const result = await executeQuery({ query, values });

        if ((result as any).error) {
            console.error('Database Error during registration:', (result as any).error);
            throw new Error((result as any).error);
        }

        // Trigger notification for Admin
        const franchiseId = (result as any).insertId;
        try {
            await sendNotification({
                title: 'New Franchise Request',
                message: `New franchise request from ${name} (${city})`,
                type: 'franchise',
                data: { franchiseId, name, city }
            });
        } catch (notifError) {
            // Don't fail registration if notification fails
            console.error('Failed to send admin notification:', notifError);
        }

        return NextResponse.json({
            message: 'Franchise registered successfully',
            franchiseId: franchiseId
        }, { status: 201 });
    } catch (error: any) {
        console.error('Register API Error:', error);
        return NextResponse.json({
            message: 'Internal Server Error',
            details: error?.message || 'Unknown error'
        }, { status: 500 });
    }
}
