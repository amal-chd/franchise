const mysql = require('serverless-mysql');
require('dotenv').config({ path: '.env.local' });

const db = mysql({
    config: {
        host: process.env.FRANCHISE_DB_HOST || '168.231.122.159',
        port: parseInt(process.env.FRANCHISE_DB_PORT || '3306'),
        database: process.env.FRANCHISE_DB_NAME || 'thekada',
        user: process.env.FRANCHISE_DB_USER || 'amal',
        password: process.env.FRANCHISE_DB_PASSWORD || '#Thekada@123!',
        ssl: { rejectUnauthorized: false }
    }
});

async function checkTables() {
    try {
        const check = async (table) => {
            try {
                const cols = await db.query(`DESCRIBE ${table}`);
                console.log(`\nColumns in ${table}:`, cols.map(c => c.Field).join(', '));
            } catch (e) { console.log(`\nTable ${table} not found or error.`); }
        };

        await check('business_settings');
        await check('stores');
        await check('vendors');
        await check('users');

    } catch (error) {
        console.error('Error checking tables:', error);
    } finally {
        await db.end();
    }
}

checkTables();
