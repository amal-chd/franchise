import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';

export async function GET() {
    try {
        // Fetch content
        const contentSnapshot = await firestore.collection('site_content').get();
        const contentRows = contentSnapshot.docs.map((doc: any) => doc.data());

        // Group content by section and parse JSON
        const content = contentRows.reduce((acc: any, row: any) => {
            if (!acc[row.section]) {
                acc[row.section] = {};
            }

            let value = row.content_value;
            // Try to parse JSON for arrays/objects
            try {
                if (value && typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
                    value = JSON.parse(value);
                }
            } catch (e) {
                // Keep as string if parse fails
            }

            acc[row.section][row.content_key] = value;
            return acc;
        }, {});

        // Fetch settings
        const settingsSnapshot = await firestore.collection('site_settings').get();
        const settingsRows = settingsSnapshot.docs.map((doc: any) => doc.data());

        const settings = settingsRows.reduce((acc: any, row: any) => {
            acc[row.setting_key] = row.setting_value;
            return acc;
        }, {});

        // Combine
        const responseData = {
            ...content,
            ...settings
        };

        return NextResponse.json(responseData);
    } catch (error: any) {
        console.error('Error fetching site content:', error);
        return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
    }
}
