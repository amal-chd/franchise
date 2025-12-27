import executeQuery from './db';

export type NotificationType = 'order' | 'franchise' | 'payment' | 'system' | 'general';

interface SendNotificationParams {
    userId?: number;
    franchiseId?: number;
    vendorId?: number;
    deliveryManId?: number;
    title: string;
    message: string;
    type?: NotificationType;
    data?: any;
}

export async function sendNotification({
    userId,
    franchiseId,
    vendorId,
    deliveryManId,
    title,
    message,
    type = 'general',
    data = null
}: SendNotificationParams) {
    try {
        const query = `
            INSERT INTO user_notifications (user_id, franchise_id, vendor_id, delivery_man_id, title, message, type, data)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            userId || null,
            franchiseId || null,
            vendorId || null,
            deliveryManId || null,
            title,
            message,
            type,
            data ? JSON.stringify(data) : null
        ];

        await executeQuery({ query, values });
        return { success: true };
    } catch (error) {
        console.error('Failed to send notification:', error);
        return { success: false, error };
    }
}

export async function getNotifications(params: {
    userId?: number;
    franchiseId?: number;
    limit?: number;
    offset?: number;
}) {
    const { userId, franchiseId, limit = 20, offset = 0 } = params;

    let query = 'SELECT * FROM user_notifications';
    const conditions = [];
    const values = [];

    if (userId) {
        conditions.push('user_id = ?');
        values.push(userId);
    }

    if (franchiseId) {
        conditions.push('franchise_id = ?');
        values.push(franchiseId);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' OR ');
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    values.push(limit, offset);

    return await executeQuery({ query, values });
}

export async function markAsRead(id: number) {
    return await executeQuery({
        query: 'UPDATE user_notifications SET is_read = TRUE WHERE id = ?',
        values: [id]
    });
}
