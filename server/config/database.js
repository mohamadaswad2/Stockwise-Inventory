/**
 * config/database.js — PostgreSQL Connection Pool
 * Uses the `pg` Pool for connection reuse across requests.
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || 'inventory_saas',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  // Keep a pool of up to 10 connections
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 2_000,
});

/**
 * Verify database connectivity at startup.
 * Throws if the connection cannot be established.
 */
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected successfully');
    client.release();
  } catch (err) {
    console.error('❌ PostgreSQL connection failed:', err.message);
    throw err;
  }
}

/**
 * Execute a parameterised query.
 * Usage: query('SELECT * FROM users WHERE id = $1', [id])
 */
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;

  if (process.env.NODE_ENV === 'development') {
    console.log(`[DB] ${duration}ms | rows: ${res.rowCount} | ${text.slice(0, 60)}`);
  }

  return res;
}

/**
 * Get a client from the pool for transactions.
 * Caller is responsible for calling client.release().
 */
async function getClient() {
  return pool.connect();
}

module.exports = { pool, query, getClient, testConnection };
