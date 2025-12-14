import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function GET() {
    try {
        const results = await executeQuery({
            query: `
                SELECT 
                    id, 
                    name as full_name, 
                    email, 
                    phone,
                    city, 
                    upi_id,
                    bank_account_number,
                    ifsc_code,
                    bank_name,
                    plan_selected,
                    status
                FROM franchise_requests 
                WHERE LOWER(TRIM(status)) = 'approved' 
                ORDER BY full_name ASC
            `,
        });

        if ((results as any).error) {
            console.error('Payouts Query Error:', (results as any).error);
            throw new Error((results as any).error);
        }

        console.log('Payouts Query Results:', JSON.stringify(results)); // Debug logging

        // We also need to fetch the plan details (share %) from site_settings to calculate payouts
        // However, the frontend will likely have the latest settings loaded.
        // For robustness, let's just return the franchise data here.
        // The frontend can map plan_selected -> revenue share using its known settings.

        return NextResponse.json(results);
    } catch (error) {
        console.error('Fetch Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
