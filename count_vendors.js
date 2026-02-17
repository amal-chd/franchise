const mysql = require('serverless-mysql');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const db = mysql({
    config: {
        host: process.env.FRANCHISE_DB_HOST || process.env.DB_HOST,
        port: parseInt(process.env.FRANCHISE_DB_PORT || process.env.DB_PORT || '3306'),
        database: process.env.FRANCHISE_DB_NAME || process.env.DB_NAME,
        user: process.env.FRANCHISE_DB_USER || process.env.DB_USER,
        password: process.env.FRANCHISE_DB_PASSWORD || process.env.DB_PASSWORD,
        ssl: { rejectUnauthorized: false }
    }
});

async function checkStores() {
    try {
        console.log('Checking stores for Zone 18...');
        const query = 'SELECT COUNT(*) as count FROM stores WHERE zone_id = 18';
        const results = await db.query(query);
        console.log('Stores Count:', results[0].count);

        const listQuery = 'SELECT id, name, status, active FROM stores WHERE zone_id = 18 LIMIT 5';
        const list = await db.query(listQuery);
        console.log('First 5 stores:', list);

        await db.end();
    } catch (e) {
        console.error('Error:', e);
    }
}

checkStores();
