
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function checkSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT || '3306')
    });

    try {
        const [tables] = await connection.execute('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);
        console.log('--- Tables in main DB ---');
        console.log(tableNames.join(', '));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

checkSchema();
