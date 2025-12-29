// Run this script to create community posts tables in database
// Usage: node scripts/create-community-tables.js

const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function createTables() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT || '3306')
    });

    try {
        console.log('Connected to database...');

        // Community Posts Table
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS community_posts (
        id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id bigint(20) NOT NULL,
        user_name varchar(255) NOT NULL,
        user_image varchar(500) DEFAULT NULL,
        content_text text,
        image_url varchar(500) DEFAULT NULL,
        role varchar(50) DEFAULT 'franchise',
        created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY user_id (user_id),
        KEY created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('✓ Created community_posts table');

        // Community Interactions Table
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS community_interactions (
        id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
        post_id bigint(20) UNSIGNED NOT NULL,
        user_id bigint(20) NOT NULL,
        type enum('like','comment') NOT NULL,
        comment_text text DEFAULT NULL,
        created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY post_id (post_id),
        KEY user_id (user_id),
        KEY type (type),
        CONSTRAINT fk_interactions_post FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('✓ Created community_interactions table');

        // Community Friendships Table
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS community_friendships (
        id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id bigint(20) NOT NULL,
        friend_id bigint(20) NOT NULL,
        status enum('pending','accepted','rejected') DEFAULT 'pending',
        created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY user_id (user_id),
        KEY friend_id (friend_id),
        UNIQUE KEY friendship_unique (user_id, friend_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('✓ Created community_friendships table');

        console.log('\n✅ All tables created successfully!');
        console.log('Community posts feature is now ready to use.');

    } catch (error) {
        console.error('❌ Error creating tables:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

createTables()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
