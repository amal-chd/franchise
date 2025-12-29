-- WhatsApp Features: Read Receipts & Online Status
-- Run this SQL to add message status and presence tracking

-- Add status columns to admin_chats table
ALTER TABLE admin_chats 
ADD COLUMN status ENUM('sent', 'delivered', 'read') DEFAULT 'sent' AFTER message,
ADD COLUMN delivered_at TIMESTAMP NULL AFTER created_at,
ADD COLUMN read_at TIMESTAMP NULL AFTER delivered_at;

-- Create user presence table
CREATE TABLE IF NOT EXISTS user_presence (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  user_type ENUM('admin', 'franchise') NOT NULL,
  is_online BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user (user_id, user_type),
  INDEX idx_user_id (user_id),
  INDEX idx_is_online (is_online)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Update existing messages to 'read' status (optional, for migration)
UPDATE admin_chats SET status = 'read' WHERE id > 0;
