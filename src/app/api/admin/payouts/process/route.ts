import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { logActivity } from '@/lib/activityLogger';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            franchise_id,
            amount,
            revenue_reported,
            orders_count,
            share_percentage,
            platform_fee_per_order,
            total_fee_deducted,
            invoice_base64
        } = body;

        await executeQuery({
            query: `
                INSERT INTO payout_logs 
                (franchise_id, amount, revenue_reported, orders_count, share_percentage, platform_fee_per_order, total_fee_deducted, payout_date, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 'processed')
            `,
            values: [
                franchise_id,
                amount,
                revenue_reported,
                orders_count,
                share_percentage,
                platform_fee_per_order,
                total_fee_deducted
            ]
        });

        // Fetch Franchise Email
        const franchiseData: any = await executeQuery({
            query: 'SELECT email, name, city FROM franchise_requests WHERE id = ?',
            values: [franchise_id]
        });

        if (franchiseData && franchiseData.length > 0) {
            const franchise = franchiseData[0];
            const email = franchise.email;

            if (email && invoice_base64) {
                console.log('Sending Payout Invoice to:', email);
                await sendEmail({
                    to: email,
                    subject: 'The Kada - Payout Processed & Invoice',
                    html: `
                        <div style="font-family: Arial, sans-serif; color: #333;">
                            <h2>Payout Processed! 💰</h2>
                            <p>Dear ${franchise.name},</p>
                            <p>Your payout of <strong>₹${amount}</strong> for the recent period has been successfully processed.</p>
                            <p>Please find the detailed invoice attached to this email.</p>
                            <br>
                            <p><strong>Summary:</strong></p>
                            <ul>
                                <li>Revenue Reported: ₹${revenue_reported}</li>
                                <li>Orders Processed: ${orders_count}</li>
                                <li>Net Payout: ₹${amount}</li>
                            </ul>
                            <br>
                            <p>Thanks for being a partner!</p>
                            <p>Best regards,<br>The Kada Team</p>
                        </div>
                    `,
                    attachments: [
                        {
                            filename: `payout_invoice_${new Date().toISOString().split('T')[0]}.pdf`,
                            content: invoice_base64,
                            encoding: 'base64'
                        }
                    ]
                });
            }
        }

        // Log Activity
        await logActivity({
            actor_id: 1, // Assuming Admin ID is 1 for now, or fetch from auth
            actor_type: 'admin',
            action: 'PAYOUT_PROCESSED',
            entity_type: 'payout',
            entity_id: franchise_id,
            details: { amount, revenue_reported, orders_count },
            // req: request as any // Cast or pass if `logActivity` expects NextRequest
        });

        return NextResponse.json({ success: true, message: 'Payout processed and invoice sent successfully' });
    } catch (error: any) {
        console.error('Error processing payout:', error);
        return NextResponse.json({ error: 'Failed to process payout' }, { status: 500 });
    }
}
