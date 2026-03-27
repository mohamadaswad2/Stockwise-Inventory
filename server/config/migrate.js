/**
 * config/migrate.js — Database Migration
 * Run with: node config/migrate.js
 * Creates all required tables if they do not already exist.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { pool } = require('./database');

const migrations = [
  // ── Users table (one row per registered account)
  `CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    name        TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'owner',
    -- Subscription fields (ready for future billing integration)
    plan        TEXT NOT NULL DEFAULT 'free',
    plan_expires_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  // ── Inventory items (each row belongs to one tenant / user)
  `CREATE TABLE IF NOT EXISTS inventory_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    sku         TEXT,
    description TEXT,
    quantity    INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER NOT NULL DEFAULT 10,
    price       NUMERIC(12,2) NOT NULL DEFAULT 0,
    category    TEXT,
    unit        TEXT NOT NULL DEFAULT 'pcs',
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Ensure SKU is unique per tenant
    UNIQUE(user_id, sku)
  )`,

  // ── Index for fast per-tenant lookups
  `CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON inventory_items(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_inventory_category  ON inventory_items(user_id, category)`,

  // ── Refresh updated_at automatically via trigger
  `CREATE OR REPLACE FUNCTION update_updated_at_column()
   RETURNS TRIGGER AS $$
   BEGIN
     NEW.updated_at = NOW();
     RETURN NEW;
   END;
   $$ language 'plpgsql'`,

  `DO $$ BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM pg_trigger WHERE tgname = 'set_users_updated_at'
     ) THEN
       CREATE TRIGGER set_users_updated_at
         BEFORE UPDATE ON users
         FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
     END IF;
   END $$`,

  `DO $$ BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM pg_trigger WHERE tgname = 'set_inventory_updated_at'
     ) THEN
       CREATE TRIGGER set_inventory_updated_at
         BEFORE UPDATE ON inventory_items
         FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
     END IF;
   END $$`,
];

async function runMigrations() {
  console.log('🔄 Running database migrations…\n');
  const client = await pool.connect();

  try {
    for (const sql of migrations) {
      await client.query(sql);
      // Print first 60 chars as a breadcrumb
      console.log(`  ✓ ${sql.trim().slice(0, 70).replace(/\n/g, ' ')}…`);
    }
    console.log('\n✅ All migrations completed successfully.');
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
