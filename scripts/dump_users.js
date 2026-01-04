
require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function main() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '3306'),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            ssl: { rejectUnauthorized: false }
        });

        // Fetch confirmed franchises
        const [rows] = await connection.execute(
            "SELECT id, name, email, password, phone, zone_id, plan_selected FROM franchise_requests WHERE status = 'approved'"
        );

        console.log(JSON.stringify(rows));
        await connection.end();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
