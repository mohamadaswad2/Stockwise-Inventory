/**
 * Seed — creates the admin account.
 * Run: npm run db:seed
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { query, testConnection } = require('./database');

async function seed() {
  await testConnection();

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@stockwise.app';
  const adminPass  = process.env.ADMIN_PASSWORD || 'Admin@StockWise2024!';
  const hashed     = await bcrypt.hash(adminPass, 12);

  await query(
    `INSERT INTO users (email, password, name, role, plan, is_email_verified, is_active)
     VALUES ($1, $2, 'Super Admin', 'admin', 'deluxe', TRUE, TRUE)
     ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, role = 'admin'`,
    [adminEmail, hashed]
  );

  console.log('[Seed] Admin account ready!');
  console.log(`[Seed] Email:    ${adminEmail}`);
  console.log(`[Seed] Password: ${adminPass}`);
  console.log('[Seed] IMPORTANT: Change password after first login!');
  process.exit(0);
}

seed().catch(err => { console.error('[Seed] Failed:', err.message); process.exit(1); });
