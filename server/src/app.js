const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes        = require('./routes/auth.routes');
const inventoryRoutes   = require('./routes/inventory.routes');
const dashboardRoutes   = require('./routes/dashboard.routes');
const userRoutes        = require('./routes/user.routes');
const adminRoutes       = require('./routes/admin.routes');
const transactionRoutes = require('./routes/transaction.routes');
const { authenticate }  = require('./middlewares/auth.middleware');
const appUpdateService  = require('./services/appUpdate.service');
const { success }       = require('./utils/response');
const { notFound, errorHandler } = require('./middlewares/error.middleware');

const app = express();
app.set('trust proxy', 1);
app.use(helmet());

const allowed = [process.env.CLIENT_URL, 'http://localhost:3000'].filter(Boolean);
app.use(cors({
  origin: (o, cb) => (!o || allowed.includes(o)) ? cb(null, true) : cb(new Error(`CORS: ${o}`)),
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/api', rateLimit({ windowMs: 15*60*1000, max: 200, standardHeaders: true, legacyHeaders: false }));

app.get('/health', (_req, res) => res.json({ success: true, message: 'API is running', ts: new Date() }));

// Public route — all users (including unauthenticated) can read updates
app.get('/api/updates', async (req, res, next) => {
  try { success(res, await appUpdateService.getUpdates(req.query)); }
  catch(e) { next(e); }
});

app.use('/api/auth',         authRoutes);
app.use('/api/inventory',    inventoryRoutes);
app.use('/api/dashboard',    dashboardRoutes);
app.use('/api/users',        userRoutes);
app.use('/api/admin',        adminRoutes);
app.use('/api/transactions', transactionRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
