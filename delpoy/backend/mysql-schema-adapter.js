/**
 * MySQL Schema Adapter
 * 
 * This file provides a utility to convert the PostgreSQL schema in schema.ts 
 * to MySQL compatible tables for cPanel deployment.
 * 
 * MySQL Compatibility Changes:
 * - Replace pgTable with mysqlTable
 * - Change datatype mappings:
 *   - serial() -> int().autoincrement()
 *   - text() -> varchar(255) or text()
 *   - json() -> json()
 *   - timestamp() -> datetime()
 *   - boolean() -> boolean()
 * - Switch default values syntax if needed
 * - Adjust foreign key relationships
 */

const fs = require('fs');
const path = require('path');

// Path to output MySQL schema
const outputPath = path.join(__dirname, '../build/mysql-schema.sql');

// Generate MySQL schema
function generateMySQLSchema() {
  const mysqlSchema = `
-- MySQL Schema for Trading Platform
-- Generated: ${new Date().toISOString()}

-- Set character set and collation
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Users table
CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`username\` varchar(255) NOT NULL,
  \`password\` varchar(255) NOT NULL,
  \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`username\` (\`username\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Broker Accounts table
CREATE TABLE IF NOT EXISTS \`broker_accounts\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`user_id\` int(11) NOT NULL,
  \`account_number\` varchar(255) NOT NULL,
  \`broker\` varchar(255) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`balance\` decimal(15,2) DEFAULT NULL,
  \`is_lead\` boolean NOT NULL DEFAULT 0,
  \`is_active\` boolean NOT NULL DEFAULT 1,
  \`auth_data\` json DEFAULT NULL,
  \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`account_number\` (\`account_number\`),
  KEY \`user_id\` (\`user_id\`),
  CONSTRAINT \`broker_accounts_ibfk_1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Copy Relationships table
CREATE TABLE IF NOT EXISTS \`copy_relationships\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`user_id\` int(11) NOT NULL,
  \`lead_account_id\` int(11) NOT NULL,
  \`follow_account_id\` int(11) NOT NULL,
  \`status\` varchar(50) NOT NULL DEFAULT 'active',
  \`size_percentage\` decimal(5,2) NOT NULL DEFAULT 100.00,
  \`allowed_symbols\` json DEFAULT NULL,
  \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`user_id\` (\`user_id\`),
  KEY \`lead_account_id\` (\`lead_account_id\`),
  KEY \`follow_account_id\` (\`follow_account_id\`),
  CONSTRAINT \`copy_relationships_ibfk_1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`copy_relationships_ibfk_2\` FOREIGN KEY (\`lead_account_id\`) REFERENCES \`broker_accounts\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`copy_relationships_ibfk_3\` FOREIGN KEY (\`follow_account_id\`) REFERENCES \`broker_accounts\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Symbols table
CREATE TABLE IF NOT EXISTS \`symbols\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`ticker\` varchar(50) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`exchange\` varchar(50) NOT NULL,
  \`sector\` varchar(50) DEFAULT NULL,
  \`type\` varchar(50) DEFAULT 'stock',
  \`is_active\` boolean NOT NULL DEFAULT 1,
  \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`ticker\` (\`ticker\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Account Symbols table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS \`account_symbols\` (
  \`account_id\` int(11) NOT NULL,
  \`symbol_id\` int(11) NOT NULL,
  \`is_allowed\` boolean NOT NULL DEFAULT 1,
  PRIMARY KEY (\`account_id\`, \`symbol_id\`),
  KEY \`symbol_id\` (\`symbol_id\`),
  CONSTRAINT \`account_symbols_ibfk_1\` FOREIGN KEY (\`account_id\`) REFERENCES \`broker_accounts\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`account_symbols_ibfk_2\` FOREIGN KEY (\`symbol_id\`) REFERENCES \`symbols\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Risk Settings table
CREATE TABLE IF NOT EXISTS \`risk_settings\` (
  \`account_id\` int(11) NOT NULL,
  \`max_position_size\` decimal(15,2) NOT NULL DEFAULT 0.00,
  \`max_daily_loss\` decimal(15,2) NOT NULL DEFAULT 0.00,
  \`max_drawdown\` decimal(15,2) NOT NULL DEFAULT 0.00,
  \`leverage_limit\` decimal(5,2) NOT NULL DEFAULT 1.00,
  \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`account_id\`),
  CONSTRAINT \`risk_settings_ibfk_1\` FOREIGN KEY (\`account_id\`) REFERENCES \`broker_accounts\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Trades table
CREATE TABLE IF NOT EXISTS \`trades\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`account_id\` int(11) NOT NULL,
  \`symbol_id\` int(11) NOT NULL,
  \`order_id\` varchar(255) NOT NULL,
  \`order_type\` varchar(50) NOT NULL,
  \`side\` varchar(50) NOT NULL,
  \`quantity\` decimal(15,6) NOT NULL,
  \`price\` decimal(15,6) NOT NULL,
  \`status\` varchar(50) NOT NULL DEFAULT 'pending',
  \`executed_at\` datetime DEFAULT NULL,
  \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`order_id\` (\`order_id\`),
  KEY \`account_id\` (\`account_id\`),
  KEY \`symbol_id\` (\`symbol_id\`),
  CONSTRAINT \`trades_ibfk_1\` FOREIGN KEY (\`account_id\`) REFERENCES \`broker_accounts\` (\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`trades_ibfk_2\` FOREIGN KEY (\`symbol_id\`) REFERENCES \`symbols\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Notifications table
CREATE TABLE IF NOT EXISTS \`notifications\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`user_id\` int(11) NOT NULL,
  \`type\` varchar(50) NOT NULL,
  \`title\` varchar(255) NOT NULL,
  \`message\` text NOT NULL,
  \`status\` varchar(50) NOT NULL DEFAULT 'unread',
  \`related_id\` int(11) DEFAULT NULL,
  \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`user_id\` (\`user_id\`),
  CONSTRAINT \`notifications_ibfk_1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Settings table
CREATE TABLE IF NOT EXISTS \`settings\` (
  \`user_id\` int(11) NOT NULL,
  \`email_notifications\` boolean NOT NULL DEFAULT 1,
  \`sms_notifications\` boolean NOT NULL DEFAULT 0,
  \`theme\` varchar(50) NOT NULL DEFAULT 'light',
  \`timezone\` varchar(50) NOT NULL DEFAULT 'UTC',
  \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`user_id\`),
  CONSTRAINT \`settings_ibfk_1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sessions table for Express session
CREATE TABLE IF NOT EXISTS \`sessions\` (
  \`session_id\` varchar(128) NOT NULL,
  \`expires\` int(11) unsigned NOT NULL,
  \`data\` mediumtext,
  PRIMARY KEY (\`session_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Default data for development

-- Sample symbols
INSERT INTO \`symbols\` (\`ticker\`, \`name\`, \`exchange\`, \`sector\`, \`type\`) VALUES
('AAPL', 'Apple Inc.', 'NASDAQ', 'Technology', 'stock'),
('MSFT', 'Microsoft Corporation', 'NASDAQ', 'Technology', 'stock'),
('GOOGL', 'Alphabet Inc.', 'NASDAQ', 'Technology', 'stock'),
('AMZN', 'Amazon.com Inc.', 'NASDAQ', 'Consumer Cyclical', 'stock'),
('TSLA', 'Tesla Inc.', 'NASDAQ', 'Automotive', 'stock'),
('SPY', 'SPDR S&P 500 ETF Trust', 'NYSE', 'Fund', 'etf'),
('QQQ', 'Invesco QQQ Trust', 'NASDAQ', 'Fund', 'etf'),
('GLD', 'SPDR Gold Shares', 'NYSE', 'Precious Metals', 'etf');

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
`;

  // Create build directory if it doesn't exist
  const buildDir = path.dirname(outputPath);
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }

  // Write the MySQL schema to the output file
  fs.writeFileSync(outputPath, mysqlSchema);
  console.log(`MySQL schema generated at ${outputPath}`);

  return true;
}

// Run the schema generation
try {
  generateMySQLSchema();
} catch (error) {
  console.error('Error generating MySQL schema:', error);
  process.exit(1);
}