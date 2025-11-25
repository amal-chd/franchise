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

async function updateSupportDB() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected!');

        // Update support_tickets table to add 'replied' status
        console.log('Updating support_tickets table status column...');
        await connection.execute(`
            ALTER TABLE support_tickets 
            MODIFY COLUMN status ENUM('open', 'replied', 'closed') DEFAULT 'open'
        `);
        console.log('support_tickets table updated successfully.');

        console.log('Database update completed successfully.');

    } catch (error) {
        console.error('Database update failed:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

updateSupportDB();
