const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false
    }
};

async function createCmsTables() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        // Drop tables if they exist to ensure clean schema
        await connection.execute('DROP TABLE IF EXISTS site_content');
        await connection.execute('DROP TABLE IF EXISTS site_settings');
        console.log('Dropped existing tables.');

        // Create site_settings table
        await connection.execute(`
            CREATE TABLE site_settings (
                setting_key VARCHAR(255) PRIMARY KEY,
                setting_value TEXT,
                setting_group VARCHAR(50)
            )
        `);
        console.log('Created site_settings table.');

        // Create site_content table
        await connection.execute(`
            CREATE TABLE site_content (
                id INT AUTO_INCREMENT PRIMARY KEY,
                section VARCHAR(50),
                content_key VARCHAR(255),
                content_value TEXT,
                content_type VARCHAR(20) DEFAULT 'text',
                UNIQUE KEY unique_content (section, content_key)
            )
        `);
        console.log('Created site_content table.');

        // Insert default settings if not exist
        const defaultSettings = [
            ['site_title', 'The Kada Franchise', 'general'],
            ['site_description', 'Empowering local commerce through hyper-local delivery.', 'general'],
            ['contact_email', 'support@thekada.in', 'contact'],
            ['contact_phone', '+91 1234567890', 'contact'],
            ['social_facebook', 'https://facebook.com', 'social'],
            ['social_twitter', 'https://twitter.com', 'social'],
            ['social_instagram', 'https://instagram.com', 'social'],
            ['social_linkedin', 'https://linkedin.com', 'social']
        ];

        for (const [key, value, group] of defaultSettings) {
            await connection.execute(`
                INSERT IGNORE INTO site_settings (setting_key, setting_value, setting_group)
                VALUES (?, ?, ?)
            `, [key, value, group]);
        }
        console.log('Inserted default settings.');

        // Insert default content if not exist
        const defaultContent = [
            ['hero', 'title', 'One Platform.<br />Endless Opportunities.', 'text'],
            ['hero', 'subtitle', 'Join the revolution in hyper-local commerce. Whether you want to own, deliver, or sell — The Kada is your partner in success.', 'text'],
            ['about', 'title', 'Why The Kada?', 'text'],
            ['about', 'description', 'We are building the digital backbone for small-town India.', 'text'],
            ['stats', 'active_franchises', '50+', 'text'],
            ['stats', 'daily_orders', '10k+', 'text'],
            ['stats', 'partner_vendors', '500+', 'text'],
            ['stats', 'partner_revenue', '₹1Cr+', 'text']
        ];

        for (const [section, key, value, type] of defaultContent) {
            await connection.execute(`
                INSERT IGNORE INTO site_content (section, content_key, content_value, content_type)
                VALUES (?, ?, ?, ?)
            `, [section, key, value, type]);
        }
        console.log('Inserted default content.');

    } catch (error) {
        console.error('Error creating tables:', error);
    } finally {
        if (connection) await connection.end();
    }
}

createCmsTables();
