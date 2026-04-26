require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { query, testConnection } = require('./database');

const migrations = [
  `CREATE EXTENSION IF NOT EXISTS pgcrypto`,

  // Users table — with email verification + subscription fields
  `CREATE TABLE IF NOT EXISTS users (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email                 VARCHAR(255) UNIQUE NOT NULL,
    password              VARCHAR(255) NOT NULL,
    name                  VARCHAR(255) NOT NULL,
    role                  VARCHAR(50)  NOT NULL DEFAULT 'owner',
    plan                  VARCHAR(50)  NOT NULL DEFAULT 'free',
    is_active             BOOLEAN      NOT NULL DEFAULT TRUE,
    is_locked             BOOLEAN      NOT NULL DEFAULT FALSE,
    is_email_verified     BOOLEAN      NOT NULL DEFAULT FALSE,
    email_verify_token    VARCHAR(255),
    email_verify_expires  TIMESTAMPTZ,
    trial_ends_at         TIMESTAMPTZ,
    stripe_customer_id    VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  )`,

  // Categories
  `CREATE TABLE IF NOT EXISTS categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, name)
  )`,

  // Inventory items
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
    cost_price           NUMERIC(12,2) NOT NULL DEFAULT 0,
    low_stock_threshold  INTEGER       NOT NULL DEFAULT 5,
    is_active            BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, sku)
  )`,

  // Subscriptions
  `CREATE TABLE IF NOT EXISTS subscriptions (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan                   VARCHAR(50)  NOT NULL DEFAULT 'free',
    status                 VARCHAR(50)  NOT NULL DEFAULT 'active',
    stripe_customer_id     VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    stripe_price_id        VARCHAR(255),
    current_period_start   TIMESTAMPTZ,
    current_period_end     TIMESTAMPTZ,
    cancel_at_period_end   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  )`,

  // Stripe webhook events (idempotency)
  `CREATE TABLE IF NOT EXISTS stripe_events (
    id         VARCHAR(255) PRIMARY KEY,
    processed  BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  // Indexes
  `CREATE INDEX IF NOT EXISTS idx_inventory_user_id  ON inventory_items(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id)`,

  // Add missing columns if upgrading existing DB
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_email_verified     BOOLEAN     NOT NULL DEFAULT FALSE`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verify_token    VARCHAR(255)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verify_expires  TIMESTAMPTZ`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_ends_at         TIMESTAMPTZ`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_locked             BOOLEAN     NOT NULL DEFAULT FALSE`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id    VARCHAR(255)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255)`,
  `ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS cost_price  NUMERIC(12,2) NOT NULL DEFAULT 0`,
  // ── App Updates (changelog / announcements) ──────────────────────────────
  `CREATE TABLE IF NOT EXISTS app_updates (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type         VARCHAR(20) NOT NULL DEFAULT 'update'
                   CHECK (type IN ('feature','update','fix','announcement')),
    title        VARCHAR(200) NOT NULL,
    content      TEXT NOT NULL,
    version      VARCHAR(20),
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    likes        INTEGER NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_app_updates_created ON app_updates(created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_app_updates_type    ON app_updates(type)`,
];

async function runMigrations() {
  await testConnection();
  console.log('[Migration] Running...');
  for (const sql of migrations) {
    try {
      await query(sql);
    } catch (err) {
      // Skip duplicate column errors gracefully
      if (!err.message.includes('already exists')) throw err;
    }
  }
  console.log('[Migration] All done!');
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error('[Migration] FAILED:', err.message);
  process.exit(1);
});
