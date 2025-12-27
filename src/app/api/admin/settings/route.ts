import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function GET() {
    try {
        const rows = await executeQuery({
            query: 'SELECT * FROM site_settings',
            values: []
        });

        const settings = (rows as any[]).reduce((acc, row) => {
            acc[row.setting_key] = row.setting_value;
            return acc;
        }, {});

        return NextResponse.json(settings);
    } catch (error: any) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { settings } = body;

        if (!settings) {
            return NextResponse.json({ error: 'Settings are required' }, { status: 400 });
        }

        for (const [key, value] of Object.entries(settings)) {
            await executeQuery({
                query: `
                    INSERT INTO site_settings (setting_key, setting_value, setting_group)
                    VALUES (?, ?, 'general')
                    ON DUPLICATE KEY UPDATE setting_value = ?
                `,
                values: [key, value, value]
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
