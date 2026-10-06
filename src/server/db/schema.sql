-- Ghorer Shopping AI Sales & Order Agent
-- MySQL Database Schema
-- Character Set: utf8mb4 (Full Bengali and Emoji support)

CREATE DATABASE IF NOT EXISTS `ghorer_shopping` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `ghorer_shopping`;

-- 1. Users & Admins
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) PRIMARY KEY,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `role` ENUM('admin', 'manager', 'operator', 'customer') DEFAULT 'admin',
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `admins` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `phone` VARCHAR(32) NOT NULL,
  `permissions` JSON,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_admin_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Products & Product Images
CREATE TABLE IF NOT EXISTS `products` (
  `id` VARCHAR(36) PRIMARY KEY,
  `product_id` VARCHAR(64) NOT NULL UNIQUE,
  `product_name` VARCHAR(255) NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `discount_price` DECIMAL(10, 2) NULL,
  `colors` JSON NOT NULL,
  `stock` INT NOT NULL DEFAULT 0,
  `size` VARCHAR(100) NOT NULL DEFAULT 'Free Size',
  `fabric` VARCHAR(150) NOT NULL,
  `kameez_length` VARCHAR(100) NULL,
  `salwar_length` VARCHAR(100) NULL,
  `orna_length` VARCHAR(100) NULL,
  `description` TEXT NOT NULL,
  `delivery_info` VARCHAR(255) NOT NULL,
  `status` ENUM('active', 'inactive', 'out_of_stock') DEFAULT 'active',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_product_status` (`status`),
  INDEX `idx_product_name` (`product_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `product_images` (
  `id` VARCHAR(36) PRIMARY KEY,
  `product_id` VARCHAR(36) NOT NULL,
  `image_url` TEXT NOT NULL,
  `is_primary` TINYINT(1) DEFAULT 0,
  `display_order` INT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_product_images_pid` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Customers
CREATE TABLE IF NOT EXISTS `customers` (
  `id` VARCHAR(36) PRIMARY KEY,
  `name` VARCHAR(191) NOT NULL,
  `mobile_number` VARCHAR(32) NOT NULL UNIQUE,
  `facebook_psid` VARCHAR(128) NULL,
  `district` VARCHAR(100) NULL,
  `total_orders` INT DEFAULT 0,
  `total_spent` DECIMAL(12, 2) DEFAULT 0.00,
  `last_order_at` DATETIME NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_customer_phone` (`mobile_number`),
  INDEX `idx_customer_psid` (`facebook_psid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Conversations & Messages
CREATE TABLE IF NOT EXISTS `conversations` (
  `id` VARCHAR(36) PRIMARY KEY,
  `customer_id` VARCHAR(36) NOT NULL,
  `facebook_psid` VARCHAR(128) NULL,
  `platform` VARCHAR(50) DEFAULT 'facebook',
  `is_human_handoff` TINYINT(1) DEFAULT 0,
  `handoff_reason` TEXT NULL,
  `handoff_requested_at` DATETIME NULL,
  `selected_product_id` VARCHAR(36) NULL,
  `selected_color` VARCHAR(50) NULL,
  `order_draft` JSON NULL,
  `awaiting_confirmation` TINYINT(1) DEFAULT 0,
  `last_message_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_conv_cust` (`customer_id`),
  INDEX `idx_conv_psid` (`facebook_psid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `messages` (
  `id` VARCHAR(36) PRIMARY KEY,
  `conversation_id` VARCHAR(36) NOT NULL,
  `sender` ENUM('customer', 'ai', 'admin') NOT NULL,
  `text` TEXT NOT NULL,
  `image_url` TEXT NULL,
  `order_summary_preview` JSON NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_msg_conv` (`conversation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Orders, Order Items & Order Status History
CREATE TABLE IF NOT EXISTS `orders` (
  `id` VARCHAR(36) PRIMARY KEY,
  `order_id` VARCHAR(64) NOT NULL UNIQUE,
  `customer_id` VARCHAR(36) NOT NULL,
  `customer_name` VARCHAR(191) NOT NULL,
  `mobile_number` VARCHAR(32) NOT NULL,
  `alternative_phone` VARCHAR(32) NULL,
  `district` VARCHAR(100) NOT NULL,
  `thana_upazila` VARCHAR(100) NOT NULL,
  `area_village` VARCHAR(150) NOT NULL,
  `full_address` TEXT NOT NULL,
  `delivery_note` TEXT NULL,
  `subtotal` DECIMAL(10, 2) NOT NULL,
  `discount_total` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `delivery_charge` DECIMAL(10, 2) NOT NULL,
  `grand_total` DECIMAL(10, 2) NOT NULL,
  `status` ENUM('Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Returned') DEFAULT 'Confirmed',
  `whatsapp_notification_sent` TINYINT(1) DEFAULT 0,
  `whatsapp_notification_status` ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
  `whatsapp_notification_error` TEXT NULL,
  `whatsapp_message_id` VARCHAR(128) NULL,
  `confirmed_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_order_code` (`order_id`),
  INDEX `idx_order_status` (`status`),
  INDEX `idx_order_customer` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `order_items` (
  `id` VARCHAR(36) PRIMARY KEY,
  `order_id` VARCHAR(36) NOT NULL,
  `product_id` VARCHAR(36) NOT NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `product_code` VARCHAR(64) NOT NULL,
  `color` VARCHAR(50) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(10, 2) NOT NULL,
  `discount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `subtotal` DECIMAL(10, 2) NOT NULL,
  `image_url` TEXT NULL,
  INDEX `idx_item_order` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `order_status_history` (
  `id` VARCHAR(36) PRIMARY KEY,
  `order_id` VARCHAR(36) NOT NULL,
  `status` ENUM('Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Returned') NOT NULL,
  `note` TEXT NULL,
  `changed_by` VARCHAR(100) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_history_order` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. WhatsApp Community, Groups & Authorized Admins
CREATE TABLE IF NOT EXISTS `whatsapp_communities` (
  `id` VARCHAR(36) PRIMARY KEY,
  `community_name` VARCHAR(191) NOT NULL,
  `community_id` VARCHAR(128) NOT NULL UNIQUE,
  `description` TEXT NULL,
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `whatsapp_groups` (
  `id` VARCHAR(36) PRIMARY KEY,
  `community_id` VARCHAR(36) NOT NULL,
  `group_name` VARCHAR(191) NOT NULL,
  `group_id` VARCHAR(128) NOT NULL UNIQUE,
  `group_type` ENUM('product_management', 'order_notification', 'general') NOT NULL,
  `description` TEXT NULL,
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_group_type` (`group_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `whatsapp_admins` (
  `id` VARCHAR(36) PRIMARY KEY,
  `name` VARCHAR(191) NOT NULL,
  `phone_number` VARCHAR(32) NOT NULL UNIQUE,
  `role` ENUM('super_admin', 'manager', 'operator') DEFAULT 'manager',
  `is_authorized` TINYINT(1) DEFAULT 1,
  `added_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_wa_admin_phone` (`phone_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Settings Tables
CREATE TABLE IF NOT EXISTS `facebook_settings` (
  `id` INT PRIMARY KEY DEFAULT 1,
  `page_id` VARCHAR(128) NOT NULL,
  `page_name` VARCHAR(191) NOT NULL,
  `page_access_token` TEXT NOT NULL,
  `verify_token` VARCHAR(128) NOT NULL,
  `app_secret` VARCHAR(128) NOT NULL,
  `webhook_url` VARCHAR(255) NOT NULL,
  `is_connected` TINYINT(1) DEFAULT 0,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `ai_settings` (
  `id` INT PRIMARY KEY DEFAULT 1,
  `model` VARCHAR(100) DEFAULT 'gemini-3.8-flash',
  `business_name` VARCHAR(191) DEFAULT 'Ghorer Shopping',
  `business_description` TEXT,
  `communication_style` VARCHAR(100) DEFAULT 'Natural Friendly Bangla',
  `system_prompt` TEXT,
  `temperature` DECIMAL(3, 2) DEFAULT 0.20,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `business_settings` (
  `id` INT PRIMARY KEY DEFAULT 1,
  `business_name` VARCHAR(191) DEFAULT 'Ghorer Shopping',
  `tagline` VARCHAR(255) DEFAULT 'প্রিমিয়াম বাটিক ও দেশীয় পোশাক সম্ভার',
  `phone` VARCHAR(32) DEFAULT '+8801819000000',
  `email` VARCHAR(191) DEFAULT 'support@ghorershopping.com',
  `address` TEXT,
  `business_hours` VARCHAR(150) DEFAULT 'সকাল ১০টা - রাত ১০টা (প্রতিদিন)',
  `about_business` TEXT,
  `delivery_policy` TEXT,
  `return_policy` TEXT,
  `exchange_policy` TEXT,
  `payment_methods` TEXT,
  `support_contact` VARCHAR(191),
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `delivery_settings` (
  `id` INT PRIMARY KEY DEFAULT 1,
  `inside_dhaka_charge` DECIMAL(10, 2) DEFAULT 70.00,
  `sub_dhaka_charge` DECIMAL(10, 2) DEFAULT 100.00,
  `outside_dhaka_charge` DECIMAL(10, 2) DEFAULT 130.00,
  `free_delivery_above` DECIMAL(10, 2) DEFAULT 3000.00,
  `estimated_dhaka_days` VARCHAR(50) DEFAULT '24-48 ঘণ্টা',
  `estimated_outside_days` VARCHAR(50) DEFAULT '2-4 কার্যদিবস',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Human Handoff & System Logs
CREATE TABLE IF NOT EXISTS `human_handoff` (
  `id` VARCHAR(36) PRIMARY KEY,
  `conversation_id` VARCHAR(36) NOT NULL,
  `customer_name` VARCHAR(191) NOT NULL,
  `customer_phone` VARCHAR(32) NULL,
  `facebook_psid` VARCHAR(128) NULL,
  `reason` TEXT NOT NULL,
  `status` ENUM('pending', 'resolved') DEFAULT 'pending',
  `requested_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` DATETIME NULL,
  INDEX `idx_handoff_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `system_logs` (
  `id` VARCHAR(36) PRIMARY KEY,
  `timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `level` ENUM('info', 'warn', 'error', 'success') DEFAULT 'info',
  `module` ENUM('AI', 'Facebook', 'WhatsApp', 'Order', 'Product', 'Database', 'Auth') NOT NULL,
  `message` TEXT NOT NULL,
  `details` JSON NULL,
  INDEX `idx_log_timestamp` (`timestamp`),
  INDEX `idx_log_module` (`module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
