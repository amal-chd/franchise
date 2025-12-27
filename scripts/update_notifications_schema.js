const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function updateSchema() {
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
        console.log('Adding franchise_id and metadata to user_notifications...');

        // Add franchise_id
        await connection.execute(`
            ALTER TABLE user_notifications 
            ADD COLUMN IF NOT EXISTS franchise_id bigint(20) UNSIGNED DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS title VARCHAR(255) DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS message TEXT DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'general',
            ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE
        `);

        console.log('Schema updated successfully.');
    } catch (error) {
        console.error('Error updating schema:', error);
    } finally {
        await connection.end();
    }
}

updateSchema();
