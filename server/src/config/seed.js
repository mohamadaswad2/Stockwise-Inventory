/**
 * Seed — creates admin account + global preset categories.
 * Run: npm run db:seed
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { query, testConnection } = require('./database');

const GLOBAL_CATEGORIES = [
  { name: 'Electronics',    description: 'Gadgets, components, devices' },
  { name: 'Clothing',       description: 'Apparel, accessories, footwear' },
  { name: 'Food & Beverage',description: 'Consumables, drinks, snacks' },
  { name: 'Stationery',     description: 'Office supplies, pens, paper' },
  { name: 'Health & Beauty',description: 'Cosmetics, supplements, personal care' },
  { name: 'Home & Living',  description: 'Furniture, decor, kitchenware' },
  { name: 'Sports',         description: 'Equipment, activewear, gear' },
  { name: 'Automotive',     description: 'Parts, accessories, tools' },
  { name: 'Books & Media',  description: 'Books, magazines, digital media' },
  { name: 'Others',         description: 'Miscellaneous items' },
];

async function seed() {
  await testConnection();
  console.log('[Seed] Starting...');

  // 1. Admin account
  const adminEmail    = process.env.ADMIN_EMAIL    || 'admin@stockwise.app';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@StockWise2024!';
  const hashed = await bcrypt.hash(adminPassword, 12);

  await query(
    `INSERT INTO users (email, password, name, role, plan, is_email_verified, is_active)
     VALUES ($1, $2, 'Super Admin', 'admin', 'deluxe', TRUE, TRUE)
     ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, role = 'admin'`,
    [adminEmail, hashed]
  );
  console.log('[Seed] Admin account ready:', adminEmail);

  // 2. Global preset categories (user_id = NULL means global/shared)
  for (const cat of GLOBAL_CATEGORIES) {
    await query(
      `INSERT INTO categories (name, description, user_id)
       VALUES ($1, $2, NULL)
       ON CONFLICT DO NOTHING`,
      [cat.name, cat.description]
    );
  }
  console.log(`[Seed] ${GLOBAL_CATEGORIES.length} global categories created.`);

  console.log('\n✅ Seed complete!');
  console.log('Admin login:');
  console.log('  Email:   ', adminEmail);
  console.log('  Password:', adminPassword);
  console.log('\n⚠️  Change admin password after first login!');
  process.exit(0);
}

seed().catch(err => {
  console.error('[Seed] FAILED:', err.message);
  process.exit(1);
});
