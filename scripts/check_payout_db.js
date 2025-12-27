
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function checkSchema() {
    const connection = await mysql.createConnection({
        host: process.env.FRANCHISE_DB_HOST,
        user: process.env.FRANCHISE_DB_USER,
        password: process.env.FRANCHISE_DB_PASSWORD,
        database: process.env.FRANCHISE_DB_NAME,
        port: parseInt(process.env.FRANCHISE_DB_PORT || '3306')
    });

    try {
        console.log('--- order_transactions schema ---');
        const [desc] = await connection.execute('DESCRIBE order_transactions');
        console.table(desc);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

checkSchema();
