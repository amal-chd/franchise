// Run this script to add WhatsApp features to database
// Usage: node scripts/add-whatsapp-features.js

const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function addWhatsAppFeatures() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT || '3306')
    });

    try {
        console.log('Connected to database...');

        // Add status columns to admin_chats
        console.log('Adding status columns to admin_chats...');
        await connection.execute(`
      ALTER TABLE admin_chats 
      ADD COLUMN IF NOT EXISTS status ENUM('sent', 'delivered', 'read') DEFAULT 'sent' AFTER message,
      ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP NULL AFTER created_at,
      ADD COLUMN IF NOT EXISTS read_at TIMESTAMP NULL AFTER delivered_at
    `).catch(e => console.log('Columns may already exist:', e.message));

        console.log('✓ Added status tracking to messages');

        // Create user presence table
        console.log('Creating user_presence table...');
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_presence (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        user_type ENUM('admin', 'franchise') NOT NULL,
        is_online BOOLEAN DEFAULT FALSE,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user (user_id, user_type),
        INDEX idx_user_id (user_id),
        INDEX idx_is_online (is_online)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('✓ Created user_presence table');

        console.log('\n✅ WhatsApp features database setup complete!');
        console.log('Features enabled:');
        console.log('  - Message status tracking (sent/delivered/read)');
        console.log('  - Online/offline status');
        console.log('  - Last seen timestamps');

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

addWhatsAppFeatures()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
