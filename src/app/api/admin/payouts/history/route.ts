import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const month = searchParams.get('month');
        const year = searchParams.get('year');

        let query = `
            SELECT pl.*, f.name as franchise_name, f.city 
            FROM payout_logs pl
            JOIN franchise_requests f ON pl.franchise_id = f.id
            WHERE 1=1
        `;
        const values = [];

        if (month && year) {
            query += ' AND MONTH(pl.payout_date) = ? AND YEAR(pl.payout_date) = ?';
            values.push(month, year);
        }

        query += ' ORDER BY pl.payout_date DESC';

        const history = await executeQuery({ query, values });
        return NextResponse.json(history);
    } catch (error: any) {
        console.error('Error fetching payout history:', error);
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}
