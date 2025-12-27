const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function checkTables() {
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
        const [rows] = await connection.execute('SHOW TABLES');
        console.log('Tables in database:', rows.map(row => Object.values(row)[0]));
    } catch (error) {
        console.error('Error checking tables:', error);
    } finally {
        await connection.end();
    }
}

checkTables();
