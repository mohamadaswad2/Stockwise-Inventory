/**
 * PostgreSQL connection pool — production-ready.
 * Supports both DATABASE_URL (Supabase/Railway) and individual env vars.
 * SSL is enabled automatically when DATABASE_URL is present (production).
 */
const { Pool } = require('pg');

let poolConfig;

if (process.env.DATABASE_URL) {
  // Production: Supabase / Railway provides a single connection string
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Required for Supabase
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
} else {
  // Local development: use individual env vars
  poolConfig = {
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME     || 'inventory_saas',
    user:     process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
}

const pool = new Pool(poolConfig);

const query = (text, params) => pool.query(text, params);
const getClient = () => pool.connect();

const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('[Database] Connected at', result.rows[0].now);
  } catch (err) {
    console.error('[Database] Connection failed:', err.message);
    throw err;
  }
};

module.exports = { query, getClient, testConnection };
