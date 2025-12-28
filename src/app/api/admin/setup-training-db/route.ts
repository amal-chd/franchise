import { NextResponse } from 'next/server';
import executeQuery from '@/lib/db';

export async function GET() {
    try {
        // Create Modules Table
        await executeQuery({
            query: `CREATE TABLE IF NOT EXISTS training_modules (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255),
                description TEXT,
                role VARCHAR(50), 
                category VARCHAR(100),
                thumbnail_url VARCHAR(255),
                duration VARCHAR(50),
                progress DOUBLE DEFAULT 0.0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            values: []
        });

        // Create Materials Table
        await executeQuery({
            query: `CREATE TABLE IF NOT EXISTS training_materials (
                id INT AUTO_INCREMENT PRIMARY KEY,
                module_id INT,
                title VARCHAR(255),
                type VARCHAR(50), 
                content_url TEXT,
                content_text TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (module_id) REFERENCES training_modules(id) ON DELETE CASCADE
            )`,
            values: []
        });

        // Create Progress Table
        await executeQuery({
            query: `CREATE TABLE IF NOT EXISTS training_progress (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                user_id BIGINT UNSIGNED NOT NULL,
                module_id INT NOT NULL,
                material_ids_json TEXT DEFAULT NULL,
                progress DECIMAL(5,2) DEFAULT 0.00,
                is_completed TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_user_module (user_id, module_id)
            )`,
            values: []
        });

        return NextResponse.json({ success: true, message: 'Training tables setup successfully' });
    } catch (error: any) {
        console.error('Error setting up training DB:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
