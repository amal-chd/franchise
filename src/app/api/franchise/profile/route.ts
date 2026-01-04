import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const email = searchParams.get('email');

    if (!id && !email) {
        return NextResponse.json({ error: 'Franchise ID or Email is required' }, { status: 400 });
    }

    try {
        let query = 'SELECT id, name, email, phone, city, plan_selected, status, zone_id, upi_id, bank_account_number, ifsc_code, bank_name, created_at FROM franchise_requests WHERE ';
        let values: any[] = [];

        if (id) {
            query += 'id = ?';
            values.push(id);
        } else {
            query += 'email = ?';
            values.push(email);
        }

        const result: any = await executeQuery({
            query: query,
            values: values
        });

        if (Array.isArray(result) && result.length > 0) {
            return NextResponse.json(result[0]);
        }

        return NextResponse.json({ error: 'Franchise not found' }, { status: 404 });
    } catch (error: any) {
        console.error('Profile Fetch Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const data = await request.json();
        const { id, name, phone, city, upi_id, bank_account_number, ifsc_code, bank_name, password } = data;

        if (!id) {
            return NextResponse.json({ error: 'Franchise ID is required' }, { status: 400 });
        }

        let updateQuery = 'UPDATE franchise_requests SET name = ?, phone = ?, city = ?, upi_id = ?, bank_account_number = ?, ifsc_code = ?, bank_name = ?';
        let values = [name, phone, city, upi_id, bank_account_number, ifsc_code, bank_name];

        if (password && password.trim().length > 0) {
            updateQuery += ', password = ?';
            values.push(password);
        }

        updateQuery += ' WHERE id = ?';
        values.push(id);

        await executeQuery({
            query: updateQuery,
            values: values
        });

        return NextResponse.json({ success: true, message: 'Profile updated successfully' });
    } catch (error: any) {
        console.error('Profile Update Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
