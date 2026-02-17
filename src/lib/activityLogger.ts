import { firestore } from './firebase';
import { NextRequest } from 'next/server';

interface LogActivityParams {
    actor_id: number | string;
    actor_type: 'admin' | 'franchise';
    action: string;
    entity_type?: string;
    entity_id?: number | string;
    details?: any;
    req?: NextRequest;
}

export async function logActivity({
    actor_id,
    actor_type,
    action,
    entity_type,
    entity_id,
    details,
    req
}: LogActivityParams) {
    try {
        // Get IP address if request object is provided
        let ip_address = 'unknown';
        if (req) {
            ip_address = req.headers.get('x-forwarded-for') ||
                req.headers.get('x-real-ip') ||
                'unknown';
        }

        await firestore.collection('activity_logs').add({
            actor_id: String(actor_id),
            actor_type,
            action,
            entity_type: entity_type || null,
            entity_id: entity_id ? String(entity_id) : null,
            details: details ? JSON.stringify(details) : null,
            ip_address,
            created_at: new Date()
        });
    } catch (error) {
        console.error('Failed to log activity:', error);
        // Silent failure to not block main operation
    }
}
