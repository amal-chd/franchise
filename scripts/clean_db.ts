// scripts/clean_db.ts
import executeQuery from '@/lib/db';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') });

async function cleanDatabase() {
    try {
        console.log('Dropping existing franchise_requests table if it exists...');
        await executeQuery({
            query: 'DROP TABLE IF EXISTS franchise_requests',
            values: [],
        });
        console.log('Creating franchise_requests table...');
        await executeQuery({
            query: `CREATE TABLE franchise_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        city VARCHAR(100) NOT NULL,
        budget VARCHAR(100) DEFAULT 'N/A',
        status VARCHAR(20) DEFAULT 'pending',
        aadhar_url VARCHAR(500),
        agreement_accepted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
            values: [],
        });
        console.log('Database cleanup complete.');
    } catch (error) {
        console.error('Error during database cleanup:', error);
        process.exit(1);
    }
}

cleanDatabase();
