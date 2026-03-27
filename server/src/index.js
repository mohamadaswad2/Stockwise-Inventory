/**
 * Entry point for the Express server.
 * Loads environment variables, initializes the app, and starts listening.
 */
require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./config/database');

const PORT = process.env.PORT || 5000;

async function startServer() {
  // Verify DB connection before accepting traffic
  await testConnection();

  app.listen(PORT, () => {
    console.log(`[Server] Running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Failed to start:', err.message);
  process.exit(1);
});
