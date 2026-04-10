const router     = require('express').Router();
const c          = require('../controllers/stripe.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Webhook must use raw body — registered in app.js BEFORE json middleware
// These routes require auth
router.use('/create-checkout-session', authenticate);
router.use('/create-portal-session',   authenticate);
router.post('/create-checkout-session', c.createCheckout);
router.post('/create-portal-session',   c.createPortal);
// Webhook — no auth, raw body handled in app.js
router.post('/webhook', c.webhook);

module.exports = router;
