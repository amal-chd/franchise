import mysql from 'serverless-mysql';

// Separate connection for the Read-Only Franchise Database
// User will provide credentials later.
// For development, these can fallback to standard env vars or be empty till provided.
const franchiseDb = mysql({
    config: {
        host: process.env.FRANCHISE_DB_HOST || process.env.DB_HOST,
        port: parseInt(process.env.FRANCHISE_DB_PORT || process.env.DB_PORT || '3306'),
        database: process.env.FRANCHISE_DB_NAME || process.env.DB_NAME,
        user: process.env.FRANCHISE_DB_USER || process.env.DB_USER,
        password: process.env.FRANCHISE_DB_PASSWORD || process.env.DB_PASSWORD,
        ssl: {
            rejectUnauthorized: false
        }
    }
});

export default async function executeFranchiseQuery({ query, values }: { query: string; values?: any[] }) {
    try {
        const results = await franchiseDb.query(query, values);
        await franchiseDb.end();
        return results;
    } catch (error: any) {
        console.error('Franchise Read-Only Database Error:', error);
        return { error };
    }
}
