
const admin = require('firebase-admin');
const mysql = require('serverless-mysql');
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        }),
    });
}
const firestore = admin.firestore();

// Initialize MySQL (Remote)
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

// fieldMapping: function to transform row
async function migrateTable(tableName, collectionName, idField = 'id', transformFn = null) {
    console.log(`Migrating ${tableName} to ${collectionName}...`);
    try {
        const rows = await db.query(`SELECT * FROM ${tableName}`);
        console.log(`Found ${rows.length} rows in ${tableName}.`);

        const batch = firestore.batch();
        let count = 0;
        let batchCount = 0;
        let batchSize = 0;

        for (const row of rows) {
            let data = { ...row };
            if (transformFn) {
                data = transformFn(data);
            }

            const docRef = firestore.collection(collectionName).doc(String(row[idField]));
            batch.set(docRef, data);
            count++;
            batchSize++;

            if (batchSize === 400) {
                await batch.commit();
                console.log(`Committed batch ${++batchCount}`);
                batchSize = 0;
                // create new batch? Firestore batch object can be reused?
                // Actually in Node SDK, you typically create a new batch after commit.
                // But wait, the variable 'batch' is const. I need to make sure I'm using it right.
                // Re-creating batch is cleaner.
            }
        }

        // Re-implementing batch logic safely
    } catch (error) {
        console.error(`Error migrating ${tableName}:`, error);
    }
}

// Fixed migration loop logic in main function to handle batches properly
async function migrateWithBatches(tableName, collectionName, idField = 'id', transformFn = null) {
    console.log(`Migrating ${tableName} to ${collectionName}...`);
    try {
        const rows = await db.query(`SELECT * FROM ${tableName}`);
        console.log(`Found ${rows.length} rows in ${tableName}.`);

        if (rows.length === 0) return;

        let batch = firestore.batch();
        let batchCount = 0;
        let infoMsgC = 0;

        for (const row of rows) {
            let data = { ...row };
            if (transformFn) {
                data = transformFn(data);
            }

            const docRef = firestore.collection(collectionName).doc(String(row[idField]));
            batch.set(docRef, data);
            batchCount++;

            if (batchCount >= 400) {
                await batch.commit();
                batch = firestore.batch(); // Create new batch
                batchCount = 0;
                console.log(`Committed batch ${++infoMsgC}`);
            }
        }

        if (batchCount > 0) {
            await batch.commit();
            console.log(`Committed final batch.`);
        }
        console.log(`Migration of ${tableName} complete.`);

    } catch (error) {
        console.error(`Error migrating ${tableName}:`, error);
    }
}


async function main() {
    // Migrate site_content (if it exists)
    await migrateWithBatches('site_content', 'site_content');

    // Migrate business_settings -> site_settings
    await migrateWithBatches('business_settings', 'site_settings');

    // Migrate vendors -> franchise_requests
    await migrateWithBatches('vendors', 'franchise_requests', 'id', (row) => {
        // Transform f_name, l_name to name
        row.name = `${row.f_name} ${row.l_name}`.trim();
        return row;
    });

    await db.end();
    console.log('Migration finished.');
}

main();
