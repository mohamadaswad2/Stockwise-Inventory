/**
 * Database migration — production-ready.
 * Run manually after deploy: railway run npm run db:migrate
 * Or set as a post-deploy command in Railway dashboard.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { query, testConnection } = require('./database');

const migrations = [
  // Enable UUID generation (PostgreSQL 13+)
  `CREATE EXTENSION IF NOT EXISTS pgcrypto`,

  // Users (tenants)
  `CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    name        VARCHAR(255) NOT NULL,
    role        VARCHAR(50)  NOT NULL DEFAULT 'owner',
    plan        VARCHAR(50)  NOT NULL DEFAULT 'free',
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  )`,

  // Categories (per-user)
  `CREATE TABLE IF NOT EXISTS categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, name)
  )`,

  // Inventory items — scoped by user_id (multi-tenant)
  `CREATE TABLE IF NOT EXISTS inventory_items (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id          UUID          REFERENCES categories(id) ON DELETE SET NULL,
    name                 VARCHAR(255)  NOT NULL,
    sku                  VARCHAR(100),
    description          TEXT,
    quantity             INTEGER       NOT NULL DEFAULT 0,
    unit                 VARCHAR(50)   NOT NULL DEFAULT 'unit',
    price                NUMERIC(12,2) NOT NULL DEFAULT 0,
    low_stock_threshold  INTEGER       NOT NULL DEFAULT 5,
    is_active            BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, sku)
  )`,

  // Subscriptions (ready for Stripe integration)
  `CREATE TABLE IF NOT EXISTS subscriptions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan        VARCHAR(50)  NOT NULL DEFAULT 'free',
    status      VARCHAR(50)  NOT NULL DEFAULT 'active',
    stripe_customer_id    VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    started_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  )`,

  // Performance indexes
  `CREATE INDEX IF NOT EXISTS idx_inventory_user_id   ON inventory_items(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_inventory_sku        ON inventory_items(user_id, sku)`,
  `CREATE INDEX IF NOT EXISTS idx_categories_user_id  ON categories(user_id)`,
];

async function runMigrations() {
  await testConnection();
  console.log('[Migration] Running migrations...');
  for (const sql of migrations) {
    await query(sql);
    console.log('[Migration] OK:', sql.slice(0, 60).replace(/\n/g, ' ') + '...');
  }
  console.log('[Migration] All done!');
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error('[Migration] FAILED:', err.message);
  process.exit(1);
});
