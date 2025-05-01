/**
 * MySQL Database Adapter for cPanel Deployment
 * 
 * This file provides a MySQL connection for use with cPanel hosting.
 * It replaces the PostgreSQL connection in db.ts for deployment.
 */

const mysql = require('mysql2/promise');
const { drizzle } = require('drizzle-orm/mysql2');
const schema = require('../dist/shared/schema');

// Read environment variables
if (!process.env.DATABASE_URL && process.env.DB_HOST) {
  // Construct DATABASE_URL from individual parameters if not provided directly
  process.env.DATABASE_URL = `mysql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME}`;
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to create a .env file or provision a database?"
  );
}

// Create connection pool
const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Initialize Drizzle ORM with MySQL
const db = drizzle(pool, { schema, mode: 'default' });

// Log database connection status
pool.getConnection()
  .then(conn => {
    console.log('Connected to MySQL database successfully!');
    conn.release();
  })
  .catch(err => {
    console.error('Failed to connect to MySQL database:', err);
  });

module.exports = {
  pool,
  db
};