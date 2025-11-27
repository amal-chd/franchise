const mysql = require('serverless-mysql');
const { loadEnvConfig } = require('@next/env');

loadEnvConfig(process.cwd());

const db = mysql({
    config: {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '3306'),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: {
            rejectUnauthorized: false
        }
    }
});

async function query(q) {
    try {
        const results = await db.query(q);
        await db.end();
        return results;
    } catch (e) {
        console.error('Query Error:', e);
        process.exit(1);
    }
}

async function main() {
    console.log('Migrating Training Tables...');

    try {
        // Add category column if it doesn't exist
        // Note: MySQL doesn't support IF NOT EXISTS for columns in ALTER TABLE directly in all versions easily without a procedure,
        // but we can just try to add it and ignore the error if it exists, or check information_schema.
        // For simplicity in this environment, I'll just try to add it. If it fails because it exists, that's fine.

        try {
            await query(`
                ALTER TABLE training_modules
                ADD COLUMN category VARCHAR(255) DEFAULT 'General' AFTER description
            `);
            console.log('Added category column to training_modules');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('Category column already exists.');
            } else {
                throw e;
            }
        }

        console.log('Migration complete.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

main();
