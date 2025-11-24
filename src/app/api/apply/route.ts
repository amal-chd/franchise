
import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { newApplicationEmail, applicationSubmittedEmail } from '@/lib/emailTemplates';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, phone, city } = body;

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
                budget VARCHAR(100) DEFAULT 'N/A',
                status VARCHAR(20) DEFAULT 'pending',
                aadhar_url VARCHAR(500),
                agreement_accepted BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        await executeQuery({
            query: createTableQuery,
            values: [],
        });

        const insertQuery = 'INSERT INTO franchise_requests (name, email, phone, city, budget, aadhar_url, agreement_accepted) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const result = await executeQuery({
            query: insertQuery,
            values: [name, email, phone, city, 'N/A', null, false],
        });

        if ((result as any).error) {
            throw new Error((result as any).error);
        }

        const requestId = (result as any).insertId;
        const applicationData = { name, email, phone, city, requestId };

        // Send email notifications (don't block response on email sending)
        Promise.all([
            // Send confirmation email to applicant
            sendEmail({
                to: email,
                subject: 'Application Received - The Kada Franchise',
                html: applicationSubmittedEmail(applicationData),
            }),
            // Send notification to admin
            sendEmail({
                to: process.env.ADMIN_EMAIL || 'thekadaapp@gmail.com',
                subject: `New Franchise Application from ${name} - ${city}`,
                html: newApplicationEmail(applicationData),
            }),
        ]).catch(error => {
            console.error('Email notification error:', error);
            // Don't fail the request if email fails
        });

        return NextResponse.json({
            message: 'Application submitted successfully',
            requestId
        }, { status: 201 });
    } catch (error) {
        console.error('Request Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
