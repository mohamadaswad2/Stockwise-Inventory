const stripeService = require('../services/stripe.service');
const { success }   = require('../utils/response');
const AppError      = require('../utils/AppError');

// POST /api/stripe/create-checkout-session
const createCheckout = async (req, res, next) => {
  try {
    const { plan } = req.body;
    if (!['starter','premium','deluxe'].includes(plan))
      throw new AppError('Invalid plan.', 400);

    const result = await stripeService.createCheckoutSession(
      req.user.id, req.user.email, plan
    );
    success(res, result);
  } catch (err) { next(err); }
};

// POST /api/stripe/create-portal-session
const createPortal = async (req, res, next) => {
  try {
    const result = await stripeService.createPortalSession(req.user.id);
    success(res, result);
  } catch (err) { next(err); }
};

// POST /api/stripe/webhook  (raw body — no JSON parsing)
const webhook = async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'];
    if (!signature) throw new AppError('No stripe-signature header.', 400);

    const result = await stripeService.handleWebhook(req.body, signature);
    res.json({ received: true, ...result });
  } catch (err) {
    console.error('[Stripe Webhook Error]', err.message);
    res.status(400).json({ error: err.message });
  }
};

module.exports = { createCheckout, createPortal, webhook };
