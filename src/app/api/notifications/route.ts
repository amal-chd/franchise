import { NextResponse } from 'next/server';
import { getNotifications, markAsRead } from '@/lib/notifications';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const franchiseId = searchParams.get('franchiseId');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        if (!userId && !franchiseId) {
            return NextResponse.json({ error: 'User ID or Franchise ID required' }, { status: 400 });
        }

        const notifications = await getNotifications({
            userId: userId ? parseInt(userId) : undefined,
            franchiseId: franchiseId ? parseInt(franchiseId) : undefined,
            limit,
            offset
        });

        return NextResponse.json(notifications);
    } catch (error: any) {
        console.error('Fetch notifications error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
        }

        await markAsRead(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Mark notification read error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
