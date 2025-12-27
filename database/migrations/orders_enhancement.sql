-- Database migration for Enterprise Orders Management System
-- Run this SQL script to add the necessary tables and indexes

-- 1. Create order_history table for timeline tracking
CREATE TABLE IF NOT EXISTS order_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    status_from VARCHAR(50),
    status_to VARCHAR(50) NOT NULL,
    changed_by INT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_order_history_order (order_id, changed_at DESC)
);

-- 2. Add updated_at column to orders table if it doesn't exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP;

-- 3. Add priority column for urgency tagging
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal';

-- 4. Add delivery deadline for SLA tracking
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_deadline DATETIME NULL;

-- 5. Performance indexes for filtering
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_franchise_zone ON orders(franchise_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_payment ON orders(payment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_dates ON orders(created_at, status);
CREATE INDEX IF NOT EXISTS idx_orders_multi ON orders(status, payment_status, franchise_id, created_at DESC);

-- 6. Full-text search index for Razorpay order ID
-- Note: Full-text indexes require MyISAM or InnoDB with specific settings
-- ALTER TABLE orders ADD FULLTEXT INDEX idx_orders_search (razorpay_order_id);

-- 7. Index for order items for join performance  
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- 8. Sample data for testing (optional - uncomment if needed)
/*
-- Insert some sample order history entries for existing orders
INSERT INTO order_history (order_id, status_to, notes)
SELECT id, status, 'Initial status entry'
FROM orders
WHERE NOT EXISTS (
    SELECT 1 FROM order_history WHERE order_history.order_id = orders.id
);
*/

-- Verify the changes
SELECT 'Orders table structure:' as Info;
DESCRIBE orders;

SELECT 'Order history table structure:' as Info;
DESCRIBE order_history;

SELECT 'Order indexes:' as Info;
SHOW INDEXES FROM orders;
