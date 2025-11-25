const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function initCloudDB() {
    console.log('Connecting to cloud database...');

    // Check if DB credentials are present
    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD) {
        console.error('Error: Database credentials missing in .env.local');
        console.error('Please ensure DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME are set.');
        process.exit(1);
    }

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
        console.log('Connected! Creating tables...');

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS franchise_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50) NOT NULL,
                city VARCHAR(100) NOT NULL,
                budget VARCHAR(100) DEFAULT 'N/A',
                status VARCHAR(20) DEFAULT 'pending',
                aadhar_url VARCHAR(500),
                agreement_accepted BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        await connection.execute(createTableQuery);
        console.log('Table "franchise_requests" created successfully.');

    } catch (error) {
        console.error('Error initializing database:', error);
    } finally {
        await connection.end();
    }
}

initCloudDB();
