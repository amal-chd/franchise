import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function GET() {
    try {
        // Add the pricing and payment columns if they don't exist
        await executeQuery({
            query: `
                ALTER TABLE franchise_requests 
                ADD COLUMN IF NOT EXISTS pricing_plan VARCHAR(50),
                ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending',
                ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(100),
                ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(100)
            `,
            values: [],
        });

        return NextResponse.json({ message: 'Pricing migration completed successfully' }, { status: 200 });
    } catch (error: any) {
        // If columns already exist, that's fine
        if (error.errno === 1060) {
            return NextResponse.json({ message: 'Pricing columns already exist' }, { status: 200 });
        }
        console.error('Pricing Migration Error:', error);
        return NextResponse.json({ message: 'Migration failed', error: error.message }, { status: 500 });
    }
}
