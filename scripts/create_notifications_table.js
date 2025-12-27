const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function createNotificationTable() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT || '3306'),
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('Creating user_notifications table...');

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS user_notifications (
                id bigint(20) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                user_id bigint(20) UNSIGNED DEFAULT NULL,
                franchise_id bigint(20) UNSIGNED DEFAULT NULL,
                vendor_id bigint(20) UNSIGNED DEFAULT NULL,
                delivery_man_id bigint(20) UNSIGNED DEFAULT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                data TEXT DEFAULT NULL,
                type VARCHAR(50) DEFAULT 'general',
                status tinyint(1) NOT NULL DEFAULT 1,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        await connection.execute(createTableQuery);
        console.log('Table "user_notifications" created successfully.');
    } catch (error) {
        console.error('Error creating table:', error);
    } finally {
        await connection.end();
    }
}

createNotificationTable();
