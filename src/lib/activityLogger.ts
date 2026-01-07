
import executeQuery from './db';
import { NextRequest } from 'next/server';

interface LogActivityParams {
    actor_id: number;
    actor_type: 'admin' | 'franchise';
    action: string;
    entity_type?: string;
    entity_id?: number;
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

        await executeQuery({
            query: `
        INSERT INTO activity_logs (actor_id, actor_type, action, entity_type, entity_id, details, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
            values: [
                actor_id,
                actor_type,
                action,
                entity_type || null,
                entity_id || null,
                details ? JSON.stringify(details) : null,
                ip_address
            ]
        });
    } catch (error) {
        console.error('Failed to log activity:', error);
        // Silent failure to not block main operation
    }
}
