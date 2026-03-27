/**
 * config/seed.js — Demo Data Seeder
 * Run with: node config/seed.js
 * Creates a demo user and sample inventory items for local testing.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { pool } = require('./database');

async function seed() {
  console.log('🌱 Seeding demo data…\n');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ── Demo user
    const hashedPassword = await bcrypt.hash('password123', 12);
    const userRes = await client.query(
      `INSERT INTO users (email, password, name, plan)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      ['demo@example.com', hashedPassword, 'Demo User', 'pro']
    );
    const userId = userRes.rows[0].id;
    console.log(`  ✓ Demo user created/updated  →  ${userId}`);

    // ── Sample inventory items
    const items = [
      { name: 'Wireless Keyboard', sku: 'WK-001', qty: 45, threshold: 10, price: 59.99, category: 'Electronics' },
      { name: 'USB-C Hub 7-Port',  sku: 'UC-002', qty:  8, threshold: 10, price: 39.99, category: 'Electronics' },
      { name: 'Ergonomic Mouse',   sku: 'EM-003', qty: 30, threshold: 15, price: 49.99, category: 'Electronics' },
      { name: 'Standing Desk Mat', sku: 'SD-004', qty:  5, threshold: 10, price: 89.99, category: 'Office' },
      { name: 'Notebook A5',       sku: 'NB-005', qty: 120,threshold: 20, price:  4.99, category: 'Stationery' },
      { name: 'Blue Pens (12pk)',   sku: 'BP-006', qty:  3, threshold: 10, price:  7.99, category: 'Stationery' },
      { name: 'Monitor Stand',      sku: 'MS-007', qty: 18, threshold:  5, price: 34.99, category: 'Office' },
      { name: 'Cable Organiser',    sku: 'CO-008', qty:  9, threshold: 10, price: 12.99, category: 'Accessories' },
    ];

    for (const item of items) {
      await client.query(
        `INSERT INTO inventory_items
           (user_id, name, sku, quantity, low_stock_threshold, price, category)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (user_id, sku) DO NOTHING`,
        [userId, item.name, item.sku, item.qty, item.threshold, item.price, item.category]
      );
      console.log(`  ✓ ${item.name}`);
    }

    await client.query('COMMIT');
    console.log('\n✅ Seed complete.');
    console.log('   Login → email: demo@example.com  |  password: password123\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
