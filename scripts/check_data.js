
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function checkData() {
    const mainConn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT || '3306')
    });

    const franchiseConn = await mysql.createConnection({
        host: process.env.FRANCHISE_DB_HOST,
        user: process.env.FRANCHISE_DB_USER,
        password: process.env.FRANCHISE_DB_PASSWORD,
        database: process.env.FRANCHISE_DB_NAME,
        port: parseInt(process.env.FRANCHISE_DB_PORT || '3306')
    });

    try {
        console.log('--- Sample Zones (thekada) ---');
        const [zones] = await franchiseConn.execute('SELECT id, name, display_name FROM zones LIMIT 5');
        console.table(zones);

        console.log('\n--- Sample Approved Franchises (main DB) ---');
        const [franchises] = await mainConn.execute('SELECT id, name, city FROM franchise_requests WHERE status = "approved" LIMIT 5');
        console.table(franchises);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mainConn.end();
        await franchiseConn.end();
    }
}

checkData();
