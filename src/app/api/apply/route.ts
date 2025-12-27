
import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { newApplicationEmail, applicationSubmittedEmail } from '@/lib/emailTemplates';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, phone, city, upi_id, bank_account_number, ifsc_code, bank_name } = body;

        if (!name || !email || !phone || !city) {
            return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
        }

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS franchise_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50) NOT NULL,
                city VARCHAR(100) NOT NULL,
                state VARCHAR(100) DEFAULT 'N/A',
                plan_selected VARCHAR(50) DEFAULT 'standard',
                budget VARCHAR(100) DEFAULT 'N/A',
                status VARCHAR(20) DEFAULT 'pending',
                aadhar_url VARCHAR(500),
                agreement_accepted BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                upi_id VARCHAR(100),
                bank_account_number VARCHAR(100),
                ifsc_code VARCHAR(50),
                bank_name VARCHAR(100)
            )
        `;

        await executeQuery({
            query: createTableQuery,
            values: [],
        });

        const insertQuery = 'INSERT INTO franchise_requests (name, email, phone, city, state, plan_selected, budget, aadhar_url, agreement_accepted, upi_id, bank_account_number, ifsc_code, bank_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const result = await executeQuery({
            query: insertQuery,
            values: [name, email, phone, city, 'N/A', 'standard', 'N/A', null, false, upi_id || null, bank_account_number || null, ifsc_code || null, bank_name || null],
            // Note: Frontend currently doesn't send 'state' or 'plan' in the initial apply step (it's name/email/city/phone).
            // 'plan' is usually selected LATER in payment step? 
            // Wait, looking at Apply Page...
        });

        if ((result as any).error) {
            throw new Error((result as any).error);
        }

        const requestId = (result as any).insertId;
        const applicationData = { name, email, phone, city, requestId };

        // Email notifications are now deferred until the agreement step

        return NextResponse.json({
            message: 'Application submitted successfully',
            requestId
        }, { status: 201 });
    } catch (error: any) {
        console.error('Request Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
