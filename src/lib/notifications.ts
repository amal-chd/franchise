import { firestore } from './firebase';

export type NotificationType = 'order' | 'franchise' | 'payment' | 'system' | 'general';

interface SendNotificationParams {
    userId?: number | string; // Support string IDs for Firestore
    franchiseId?: number | string;
    vendorId?: number | string;
    deliveryManId?: number | string;
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
        await firestore.collection('user_notifications').add({
            user_id: userId ? String(userId) : null,
            franchise_id: franchiseId ? String(franchiseId) : null,
            vendor_id: vendorId ? String(vendorId) : null,
            delivery_man_id: deliveryManId ? String(deliveryManId) : null,
            title,
            message,
            type,
            data: data ? JSON.stringify(data) : null,
            is_read: false,
            created_at: new Date()
        });
        return { success: true };
    } catch (error: any) {
        console.error('Failed to send notification:', error);
        return { success: false, error };
    }
}

export async function getNotifications(params: {
    userId?: number | string;
    franchiseId?: number | string;
    limit?: number;
    offset?: number; // Offset might be tricky in Firestore without a cursor, will fetch recent for now
}) {
    const { userId, franchiseId, limit = 20 } = params;

    try {
        let query: any = firestore.collection('user_notifications').orderBy('created_at', 'desc');

        if (userId) {
            query = query.where('user_id', '==', String(userId));
        } else if (franchiseId) {
            query = query.where('franchise_id', '==', String(franchiseId));
        }

        query = query.limit(limit);

        const snapshot = await query.get();
        const notifications = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
            created_at: doc.data().created_at?.toDate ? doc.data().created_at.toDate() : doc.data().created_at
        }));

        return notifications;
    } catch (error) {
        console.error('Failed to get notifications:', error);
        return [];
    }
}

export async function markAsRead(id: string) {
    try {
        await firestore.collection('user_notifications').doc(id).update({ is_read: true });
        return { affectedRows: 1 };
    } catch (error) {
        console.error('Failed to mark as read:', error);
        throw error;
    }
}
