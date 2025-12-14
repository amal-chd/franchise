import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, phone, city, password } = body;

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
            (name, email, phone, city, password, plan_selected, status, agreement_accepted, budget) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            'Standard' // Default budget to satisfy DB constraint
        ];

        const result = await executeQuery({ query, values });

        if ((result as any).error) {
            throw new Error((result as any).error);
        }

        return NextResponse.json({
            message: 'Franchise registered successfully',
            franchiseId: (result as any).insertId
        }, { status: 201 });
    } catch (error) {
        console.error('Register Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
