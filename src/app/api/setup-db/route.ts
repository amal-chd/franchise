import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function GET() {
    try {
        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        actor_id INT NOT NULL,
        actor_type VARCHAR(50) NOT NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50),
        entity_id INT,
        details JSON,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

        await executeQuery({ query: createTableQuery });

        return NextResponse.json({ message: 'Database setup completed successfully.' });
    } catch (error: any) {
        console.error('Database setup error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
