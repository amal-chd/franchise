
import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';

export async function GET() {
    try {
        const snapshot = await firestore.collection('site_settings').get();
        const settings: Record<string, any> = {};

        snapshot.forEach(doc => {
            const data = doc.data();
            settings[data.setting_key] = data.setting_value;
        });

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

        const batch = firestore.batch();

        for (const [key, value] of Object.entries(settings)) {
            // Use setting_key as document ID for easy lookup and upsert
            const docRef = firestore.collection('site_settings').doc(key);
            batch.set(docRef, {
                setting_key: key,
                setting_value: value,
                setting_group: 'general', // Default group
                updated_at: new Date()
            }, { merge: true });
        }

        await batch.commit();

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
