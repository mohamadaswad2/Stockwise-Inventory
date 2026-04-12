require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { query, testConnection } = require('./database');

const migrations = [
  `CREATE EXTENSION IF NOT EXISTS pgcrypto`,

  `CREATE TABLE IF NOT EXISTS users (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email                  VARCHAR(255) UNIQUE NOT NULL,
    password               VARCHAR(255) NOT NULL,
    name                   VARCHAR(255) NOT NULL,
    role                   VARCHAR(50)  NOT NULL DEFAULT 'owner',
    plan                   VARCHAR(50)  NOT NULL DEFAULT 'free',
    is_active              BOOLEAN      NOT NULL DEFAULT TRUE,
    is_locked              BOOLEAN      NOT NULL DEFAULT FALSE,
    is_email_verified      BOOLEAN      NOT NULL DEFAULT FALSE,
    email_verify_token     VARCHAR(255),
    email_verify_expires   TIMESTAMPTZ,
    trial_ends_at          TIMESTAMPTZ,
    stripe_customer_id     VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, name)
  )`,

  `CREATE TABLE IF NOT EXISTS inventory_items (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id         UUID          REFERENCES categories(id) ON DELETE SET NULL,
    name                VARCHAR(255)  NOT NULL,
    sku                 VARCHAR(100),
    description         TEXT,
    quantity            INTEGER       NOT NULL DEFAULT 0,
    unit                VARCHAR(50)   NOT NULL DEFAULT 'unit',
    price               NUMERIC(12,2) NOT NULL DEFAULT 0,
    cost_price          NUMERIC(12,2) NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER       NOT NULL DEFAULT 5,
    is_active           BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, sku)
  )`,

  /* Sprint 2: Transactions table */
  `CREATE TABLE IF NOT EXISTS transactions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id     UUID          NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    type        VARCHAR(20)   NOT NULL CHECK (type IN ('sale','restock','adjustment','usage')),
    quantity    INTEGER       NOT NULL,
    unit_price  NUMERIC(12,2) NOT NULL DEFAULT 0,
    total       NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    note        TEXT,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS subscriptions (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan                   VARCHAR(50) NOT NULL DEFAULT 'free',
    status                 VARCHAR(50) NOT NULL DEFAULT 'active',
    stripe_customer_id     VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    stripe_price_id        VARCHAR(255),
    current_period_start   TIMESTAMPTZ,
    current_period_end     TIMESTAMPTZ,
    cancel_at_period_end   BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS stripe_events (
    id         VARCHAR(255) PRIMARY KEY,
    processed  BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  /* Indexes */
  `CREATE INDEX IF NOT EXISTS idx_inventory_user    ON inventory_items(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_categories_user   ON categories(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_user  ON transactions(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_item  ON transactions(item_id)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_date  ON transactions(user_id, created_at DESC)`,

  /* Alter existing tables safely */
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_email_verified      BOOLEAN     NOT NULL DEFAULT FALSE`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verify_token     VARCHAR(255)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verify_expires   TIMESTAMPTZ`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_ends_at          TIMESTAMPTZ`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_locked              BOOLEAN     NOT NULL DEFAULT FALSE`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id     VARCHAR(255)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_token   VARCHAR(255)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMPTZ`,
  `ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS cost_price   NUMERIC(12,2) NOT NULL DEFAULT 0`,

  // Financial precision fixes — run idempotently
  // 1. Add cost_price to transactions (missing column — root cause of Quick Sell cost = 0)
  `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS cost_price NUMERIC(12,4) NOT NULL DEFAULT 0`,
  // 2. Upgrade price/cost precision from 2dp → 4dp to prevent rounding before multiply
  //    e.g. 0.495 × 20 = 9.90 (correct) vs 0.50 × 20 = 10.00 (wrong)
  `ALTER TABLE transactions    ALTER COLUMN unit_price  TYPE NUMERIC(12,4)`,
  `ALTER TABLE transactions    ALTER COLUMN cost_price  TYPE NUMERIC(12,4)`,
  `ALTER TABLE inventory_items ALTER COLUMN price       TYPE NUMERIC(12,4)`,
  `ALTER TABLE inventory_items ALTER COLUMN cost_price  TYPE NUMERIC(12,4)`,
];

async function run() {
  await testConnection();
  console.log('[Migration] Running...');
  for (const sql of migrations) {
    try { await query(sql); }
    catch (e) { if (!e.message.includes('already exists')) throw e; }
  }
  console.log('[Migration] Done ✓');
  process.exit(0);
}
run().catch(e => { console.error('[Migration] FAILED:', e.message); process.exit(1); });
