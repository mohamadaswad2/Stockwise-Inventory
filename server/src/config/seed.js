/**
 * Database seed script.
 * Run with: npm run db:seed
 *
 * Seed 2 benda:
 * 1. System/global preset categories (user_id = NULL) — admin yang control
 * 2. Demo user dengan sample inventory items
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { query, testConnection } = require('./database');

// ─────────────────────────────────────────────────────────────
// PRESET CATEGORIES — edit sini untuk tambah/buang category
// user_id = NULL bermakna ia global, semua user boleh nampak
// ─────────────────────────────────────────────────────────────
const PRESET_CATEGORIES = [
  { name: 'Elektronik',         description: 'Telefon, laptop, aksesori elektronik' },
  { name: 'Makanan & Minuman',  description: 'Produk makanan, minuman, supplement' },
  { name: 'Pakaian & Fesyen',   description: 'Baju, seluar, kasut, aksesori pakaian' },
  { name: 'Pejabat & Alat Tulis', description: 'Kertas, pen, fail, peralatan pejabat' },
  { name: 'Peralatan Rumah',    description: 'Perabot, peralatan dapur, hiasan rumah' },
  { name: 'Kesihatan & Kecantikan', description: 'Ubat, vitamin, produk kecantikan' },
  { name: 'Automotif',          description: 'Aksesori kereta, motosikal, spare part' },
  { name: 'Sukan & Hobi',       description: 'Peralatan sukan, permainan, hobi' },
  { name: 'Bahan Binaan',       description: 'Simen, besi, cat, bahan pembinaan' },
  { name: 'Lain-lain',          description: 'Produk yang tidak termasuk dalam kategori lain' },
];

async function seed() {
  await testConnection();
  console.log('[Seed] Seeding database...');

  // ── 1. Insert preset global categories ──────────────────────
  console.log('[Seed] Inserting preset categories...');
  let firstCatId = null;

  for (const cat of PRESET_CATEGORIES) {
    const result = await query(
      `INSERT INTO categories (user_id, name, description)
       VALUES (NULL, $1, $2)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [cat.name, cat.description]
    );
    if (!firstCatId && result.rows[0]) {
      firstCatId = result.rows[0].id;
    }
  }

  // Ambil id kategori Elektronik untuk demo items
  const elektronikResult = await query(
    `SELECT id FROM categories WHERE name = 'Elektronik' AND user_id IS NULL`
  );
  const elektronikId = elektronikResult.rows[0]?.id;

  // ── 2. Insert demo user ──────────────────────────────────────
  console.log('[Seed] Inserting demo user...');
  const hashedPassword = await bcrypt.hash('demo1234', 12);

  const userResult = await query(
    `INSERT INTO users (email, password, name, role, plan)
     VALUES ($1, $2, $3, 'owner', 'pro')
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    ['demo@inventorysaas.com', hashedPassword, 'Demo User']
  );
  const userId = userResult.rows[0].id;

  // ── 3. Insert sample inventory items ────────────────────────
  const items = [
    ['USB-C Cable 2m',      'CBL-001', 'High-speed USB-C charging cable', 150, 'pcs',  9.99, 20],
    ['Wireless Mouse',      'MSE-001', 'Ergonomic wireless mouse',          45, 'pcs', 29.99, 10],
    ['Mechanical Keyboard', 'KBD-001', 'TKL mechanical keyboard',            8, 'pcs', 89.99, 10],
    ['HDMI Cable 1m',       'CBL-002', 'HDMI 2.1 cable',                   200, 'pcs',  7.99, 30],
    ['Monitor Stand',       'STD-001', 'Adjustable monitor riser',            3, 'pcs', 45.00,  5],
  ];

  for (const [name, sku, desc, qty, unit, price, threshold] of items) {
    await query(
      `INSERT INTO inventory_items
         (user_id, category_id, name, sku, description, quantity, unit, price, low_stock_threshold)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT DO NOTHING`,
      [userId, elektronikId, name, sku, desc, qty, unit, price, threshold]
    );
  }

  console.log('[Seed] ✓ Preset categories:', PRESET_CATEGORIES.length);
  console.log('[Seed] ✓ Demo user: demo@inventorysaas.com / demo1234');
  console.log('[Seed] Done!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('[Seed] Failed:', err.message);
  process.exit(1);
});
