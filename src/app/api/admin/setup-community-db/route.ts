import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function GET() {
    try {
        // 1. Community Posts Table
        await executeQuery({
            query: `CREATE TABLE IF NOT EXISTS community_posts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id BIGINT UNSIGNED NOT NULL,
                user_name VARCHAR(255),
                user_image VARCHAR(255),
                role VARCHAR(50) DEFAULT 'franchise',
                content_text TEXT,
                image_url VARCHAR(255),
                likes_count INT DEFAULT 0,
                comments_count INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            values: []
        });

        // 2. Friendships Table (Social Graph)
        await executeQuery({
            query: `CREATE TABLE IF NOT EXISTS friendships (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id BIGINT UNSIGNED NOT NULL,
                friend_id BIGINT UNSIGNED NOT NULL,
                status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_friendship (user_id, friend_id)
            )`,
            values: []
        });

        // 3. Interactions Table (Likes & Comments)
        await executeQuery({
            query: `CREATE TABLE IF NOT EXISTS community_interactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                post_id INT NOT NULL,
                user_id BIGINT UNSIGNED NOT NULL,
                type ENUM('like', 'comment') NOT NULL,
                comment_text TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE
            )`,
            values: []
        });

        // 4. Community Messages Table (P2P Chat)
        await executeQuery({
            query: `CREATE TABLE IF NOT EXISTS community_messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sender_id BIGINT UNSIGNED NOT NULL,
                receiver_id BIGINT UNSIGNED NOT NULL,
                message TEXT,
                attachment_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_sender_receiver (sender_id, receiver_id),
                INDEX idx_receiver_sender (receiver_id, sender_id)
            )`,
            values: []
        });

        return NextResponse.json({ success: true, message: 'Community DB setup successfully' });
    } catch (error: any) {
        console.error('Error setting up community DB:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
