const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Function to load env variables from .env.local
function loadEnv() {
    try {
        const envPath = path.join(__dirname, '../.env.local');
        if (fs.existsSync(envPath)) {
            const envConfig = fs.readFileSync(envPath, 'utf8');
            envConfig.split('\n').forEach(line => {
                const [key, value] = line.split('=');
                if (key && value) {
                    process.env[key.trim()] = value.trim();
                }
            });
            console.log('Loaded environment variables from .env.local');
        }
    } catch (error) {
        console.error('Error loading .env.local:', error);
    }
}

loadEnv();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '3306'),
    ssl: {
        rejectUnauthorized: false
    }
};

async function initCMSDB() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS site_content (
                id INT AUTO_INCREMENT PRIMARY KEY,
                content_key VARCHAR(255) NOT NULL UNIQUE,
                content_value TEXT,
                content_type VARCHAR(50) DEFAULT 'text',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `;

        await connection.execute(createTableQuery);
        console.log('site_content table created or already exists.');

        // Insert some default content if not exists
        const defaultContent = [
            { key: 'hero_title', value: 'Build Your Future with The Kada Franchise' },
            { key: 'hero_subtitle', value: 'Join the fastest growing retail network in Kerala. Low investment, high returns, and full support.' },
            { key: 'about_text', value: 'The Kada Franchise is a revolutionary retail concept designed to empower local entrepreneurs...' },
            { key: 'contact_email', value: 'franchise@thekada.com' },
            { key: 'contact_phone', value: '+91 98765 43210' }
        ];

        for (const item of defaultContent) {
            await connection.execute(
                `INSERT IGNORE INTO site_content (content_key, content_value) VALUES (?, ?)`,
                [item.key, item.value]
            );
        }
        console.log('Default content initialized.');

    } catch (error) {
        console.error('Error initializing CMS database:', error);
    } finally {
        if (connection) await connection.end();
    }
}

initCMSDB();
