// Debug Stats Script


// Since I can't easily import TS files in a loose JS script without compilation, 
// I will create a standalone script with mysql2 connection using credentials from .env.local

require('dotenv').config({ path: '.env.local' });
const mysql = require('serverless-mysql')({
    config: {
        host: process.env.FRANCHISE_DB_HOST,
        port: parseInt(process.env.FRANCHISE_DB_PORT || '3306'),
        database: process.env.FRANCHISE_DB_NAME,
        user: process.env.FRANCHISE_DB_USER,
        password: process.env.FRANCHISE_DB_PASSWORD
    }
});

async function debugStats() {
    try {
        const zoneId = 18;
        console.log(`Checking stats for Zone ${zoneId}...`);

        // 1. Count ALL orders by status for Zone 18
        const orderStats = await mysql.query(
            `SELECT order_status, COUNT(*) as count FROM orders WHERE zone_id = ? GROUP BY order_status`,
            [zoneId]
        );
        console.log(`Order Statuses for Zone ${zoneId}:`, orderStats);

        // 2. Check ANY orders in the system to verify DB isn't empty
        const allOrders = await mysql.query(
            `SELECT zone_id, COUNT(*) as count FROM orders GROUP BY zone_id`
        );
        console.log('Orders by Zone:', allOrders);

        // 3. Check Order Transactions for ANY order
        const transactions = await mysql.query(
            `SELECT COUNT(*) as count FROM order_transactions`
        );
        console.log('Total Order Transactions in DB:', transactions[0].count);

        // 4. Check if there are any orders with commissions in this zone (even if status mismatch)
        const commissionCheck = await mysql.query(
            `SELECT o.id, o.order_status, ot.admin_commission 
             FROM orders o
             LEFT JOIN order_transactions ot ON o.id = ot.order_id
             WHERE o.zone_id = ? AND ot.admin_commission > 0
             LIMIT 5`,
            [zoneId]
        );
        console.log('Orders with Commission (Any Status):', commissionCheck);

    } catch (e) {
        console.error(e);
    } finally {
        mysql.end();
    }
}

debugStats();
