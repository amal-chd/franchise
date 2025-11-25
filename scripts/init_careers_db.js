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
    database: process.env.DB_DATABASE || process.env.DB_NAME, // Handle both naming conventions
    port: parseInt(process.env.DB_PORT || '3306'),
    ssl: {
        rejectUnauthorized: false
    }
};

async function initCareersDB() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS careers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                department VARCHAR(100) NOT NULL,
                location VARCHAR(100) NOT NULL,
                type VARCHAR(50) NOT NULL,
                description TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        await connection.execute(createTableQuery);
        console.log('Careers table created or already exists.');

    } catch (error) {
        console.error('Error initializing careers database:', error);
    } finally {
        if (connection) await connection.end();
    }
}

initCareersDB();
