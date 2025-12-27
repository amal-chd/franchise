import mysql from 'serverless-mysql';

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

export default async function executeQuery({ query, values }: { query: string; values?: any[] }) {
    try {
        const results = await db.query(query, values);
        await db.end();
        return results;
    } catch (error: any) {
        console.error('Database Error:', error);
        return { error };
    }
}
