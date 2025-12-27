import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function GET() {
    try {
        // 1. Shop: Products Table
        await executeQuery({
            query: `CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10, 2) NOT NULL,
                image_url VARCHAR(500),
                category VARCHAR(100) DEFAULT 'Merchandise',
                stock INT DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            values: []
        });

        // 2. Shop: Orders Table
        await executeQuery({
            query: `CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                franchise_id INT NOT NULL,
                total_amount DECIMAL(10, 2) NOT NULL,
                status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, cancelled
                payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            values: []
        });

        // 3. Shop: Order Items Table
        await executeQuery({
            query: `CREATE TABLE IF NOT EXISTS order_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity INT NOT NULL,
                price_at_time DECIMAL(10, 2) NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id)
            )`,
            values: []
        });

        // 4. Chat: Sessions Table
        await executeQuery({
            query: `CREATE TABLE IF NOT EXISTS chat_sessions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                franchise_id INT NOT NULL,
                admin_id INT, -- Nullable if not assigned yet
                status VARCHAR(50) DEFAULT 'open', -- open, closed
                last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            values: []
        });

        // 5. Chat: Messages Table
        await executeQuery({
            query: `CREATE TABLE IF NOT EXISTS chat_messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                session_id INT NOT NULL,
                sender_type VARCHAR(50) NOT NULL, -- 'admin' or 'franchise'
                sender_id INT NOT NULL,
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
            )`,
            values: []
        });

        // 6. Plan: Change Requests
        await executeQuery({
            query: `CREATE TABLE IF NOT EXISTS plan_change_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                franchise_id INT NOT NULL,
                current_plan VARCHAR(100),
                requested_plan VARCHAR(100),
                status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            values: []
        });

        return NextResponse.json({ success: true, message: 'Enhancement tables created successfully' });
    } catch (error: any) {
        console.error('Migration failed:', error);
        return NextResponse.json({ error: 'Migration failed', details: error }, { status: 500 });
    }
}
