const mysql = require('serverless-mysql');
const { loadEnvConfig } = require('@next/env');

loadEnvConfig(process.cwd());

const db = mysql({
    config: {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '3306'),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: {
            rejectUnauthorized: false
        }
    }
});

async function query(q) {
    try {
        const results = await db.query(q);
        await db.end();
        return results;
    } catch (e) {
        console.error('Query Error:', e);
        process.exit(1);
    }
}

async function main() {
    console.log('Initializing Training Tables...');
    console.log(`Connecting to ${process.env.DB_HOST} as ${process.env.DB_USER}...`);

    try {
        // Create training_modules table
        await query(`
            CREATE TABLE IF NOT EXISTS training_modules (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                role ENUM('franchise', 'delivery_partner', 'vendor') NOT NULL,
                thumbnail_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Created training_modules table');

        // Create training_materials table
        await query(`
            CREATE TABLE IF NOT EXISTS training_materials (
                id INT AUTO_INCREMENT PRIMARY KEY,
                module_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                type ENUM('video', 'pdf', 'image', 'text') NOT NULL,
                content_url VARCHAR(255),
                content_text TEXT,
                order_index INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (module_id) REFERENCES training_modules(id) ON DELETE CASCADE
            )
        `);
        console.log('Created training_materials table');

        console.log('Initialization complete.');
        process.exit(0);
    } catch (error) {
        console.error('Initialization failed:', error);
        process.exit(1);
    }
}

main();
