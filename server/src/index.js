require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./config/database');
const { verifyEmailConfig } = require('./utils/email');

const PORT = process.env.PORT || 5000;

async function start() {
  await testConnection();
  await verifyEmailConfig(); // Log SMTP status on boot
  app.listen(PORT, () =>
    console.log(`[Server] Running on port ${PORT} — ${process.env.NODE_ENV || 'development'}`)
  );
}

start().catch(err => { console.error('[Server] Failed:', err.message); process.exit(1); });
