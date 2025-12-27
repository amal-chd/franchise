const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function simulate() {
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
        console.log('Simulating notifications...');

        // Clear previous test data
        await connection.execute('DELETE FROM user_notifications WHERE title LIKE "SIMULATED:%"');

        // 1. New Franchise Request (for Admin - User ID 1)
        await connection.execute(`
            INSERT INTO user_notifications (user_id, title, message, type, data)
            VALUES (1, 'SIMULATED: New Franchise Request', 'John Doe wants to open a franchise in Mumbai', 'franchise', '{"franchiseId": 999}')
        `);

        // 2. New Order (for Franchise 1)
        await connection.execute(`
            INSERT INTO user_notifications (franchise_id, title, message, type, data)
            VALUES (1, 'SIMULATED: New Order Received', 'Order #101 received for ₹1200', 'order', '{"orderId": 101}')
        `);

        console.log('Simulated 2 notifications.');
    } catch (error) {
        console.error('Simulation error:', error);
    } finally {
        await connection.end();
    }
}

simulate();
