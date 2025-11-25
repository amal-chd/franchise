const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Environment variables will be loaded via --env-file flag

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '3306'),
    ssl: {
        rejectUnauthorized: false
    }
};

async function initSupportDB() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected!');

        // Create support_tickets table
        console.log('Creating support_tickets table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS support_tickets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                subject VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                status ENUM('open', 'closed') DEFAULT 'open',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('support_tickets table created.');

        // Create ticket_replies table
        console.log('Creating ticket_replies table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS ticket_replies (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ticket_id INT NOT NULL,
                sender_type ENUM('user', 'admin') NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
            )
        `);
        console.log('ticket_replies table created.');

        console.log('Database initialization for support system completed successfully.');

    } catch (error) {
        console.error('Database initialization failed:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

initSupportDB();
