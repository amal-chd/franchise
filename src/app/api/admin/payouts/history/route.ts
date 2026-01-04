import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const month = searchParams.get('month');
        const year = searchParams.get('year');

        let query = supabase
            .from('payout_logs')
            .select(`
                *,
                franchise_requests (
                    name,
                    city
                )
            `)
            .order('payout_date', { ascending: false });

        // Filter by month/year if provided
        // Note: Supabase doesn't have direct MONTH() function in builder, so we might filter by range or assume clients send date range.
        // For simplicity, if month/year are passed, we construct a range.
        if (month && year) {
            const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
            // Calculate end date (start of next month)
            const nextMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1;
            const nextYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year);
            const endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;

            query = query.gte('payout_date', startDate).lt('payout_date', endDate);
        }

        const { data: history, error } = await query;

        if (error) {
            // If table doesn't exist, return empty array instead of crashing
            if (error.code === '42P01') return NextResponse.json([]);
            throw error;
        }

        // Flatten structure
        const flattened = history.map((h: any) => ({
            ...h,
            franchise_name: h.franchise_requests?.name,
            city: h.franchise_requests?.city
        }));

        return NextResponse.json(flattened);
    } catch (error: any) {
        console.error('Error fetching payout history:', error);
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}
