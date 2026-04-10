const db = require('../config/database');

// Lazy-load Stripe to avoid crash if package not installed in dev
let _stripe;
const getStripe = () => {
  if (!_stripe) {
    const Stripe = require('stripe');
    _stripe = Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
  }
  return _stripe;
};

// Map plan key → Stripe Price ID from env
const getPriceId = (plan) => {
  const map = {
    starter: process.env.STRIPE_PRICE_STARTER_MYR,
    premium: process.env.STRIPE_PRICE_PREMIUM_MYR,
    deluxe:  process.env.STRIPE_PRICE_DELUXE_MYR,
  };
  const priceId = map[plan];
  if (!priceId) throw new Error(`No Stripe price configured for plan: ${plan}`);
  return priceId;
};

// Map Stripe Price ID → plan key
const getPlanFromPriceId = (priceId) => {
  const map = {
    [process.env.STRIPE_PRICE_STARTER_MYR]: 'starter',
    [process.env.STRIPE_PRICE_PREMIUM_MYR]: 'premium',
    [process.env.STRIPE_PRICE_DELUXE_MYR]:  'deluxe',
  };
  return map[priceId] || null;
};

// Create Stripe Checkout Session
const createCheckoutSession = async (userId, userEmail, plan) => {
  const stripe  = getStripe();
  const priceId = getPriceId(plan);
  const clientUrl = process.env.CLIENT_URL;

  // Get or create Stripe customer
  let { rows } = await db.query(
    'SELECT stripe_customer_id FROM users WHERE id = $1', [userId]
  );
  let customerId = rows[0]?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email:    userEmail,
      metadata: { userId },
    });
    customerId = customer.id;
    await db.query(
      'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
      [customerId, userId]
    );
  }

  const session = await stripe.checkout.sessions.create({
    customer:             customerId,
    mode:                 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${clientUrl}/settings/billing?success=1&plan=${plan}`,
    cancel_url:  `${clientUrl}/settings/billing?cancelled=1`,
    metadata: { userId, plan },
    subscription_data: {
      metadata: { userId, plan },
    },
    allow_promotion_codes: true,
  });

  return { url: session.url, sessionId: session.id };
};

// Create customer portal session (manage/cancel subscription)
const createPortalSession = async (userId) => {
  const stripe = getStripe();
  const { rows } = await db.query(
    'SELECT stripe_customer_id FROM users WHERE id = $1', [userId]
  );
  const customerId = rows[0]?.stripe_customer_id;
  if (!customerId) throw new Error('No Stripe customer found.');

  const session = await stripe.billingPortal.sessions.create({
    customer:   customerId,
    return_url: `${process.env.CLIENT_URL}/settings/billing`,
  });
  return { url: session.url };
};

// Handle webhook events — idempotent
const handleWebhook = async (payload, signature) => {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    throw new Error(`Webhook signature invalid: ${err.message}`);
  }

  // Idempotency check — skip already-processed events
  const existing = await db.query(
    'SELECT id FROM stripe_events WHERE id = $1', [event.id]
  );
  if (existing.rows.length > 0) return { skipped: true };

  // Record event
  await db.query(
    'INSERT INTO stripe_events (id, processed) VALUES ($1, FALSE)', [event.id]
  );

  // Handle relevant events
  switch (event.type) {

    case 'checkout.session.completed': {
      const session    = event.data.object;
      const userId     = session.metadata?.userId;
      const plan       = session.metadata?.plan;
      const subId      = session.subscription;
      const customerId = session.customer;
      if (userId && plan) {
        await db.query(
          `UPDATE users
           SET plan = $1, stripe_subscription_id = $2, stripe_customer_id = $3,
               is_locked = FALSE, trial_ends_at = NULL, updated_at = NOW()
           WHERE id = $4`,
          [plan, subId, customerId, userId]
        );
        // Upsert subscription record
        await db.query(
          `INSERT INTO subscriptions (user_id, plan, status, stripe_customer_id, stripe_subscription_id)
           VALUES ($1, $2, 'active', $3, $4)
           ON CONFLICT (user_id) DO UPDATE
           SET plan = $2, status = 'active', stripe_subscription_id = $4, updated_at = NOW()`,
          [userId, plan, customerId, subId]
        );
      }
      break;
    }

    case 'customer.subscription.updated': {
      const sub     = event.data.object;
      const priceId = sub.items?.data?.[0]?.price?.id;
      const plan    = getPlanFromPriceId(priceId);
      const status  = sub.status; // 'active', 'past_due', 'canceled', etc.
      if (plan && sub.metadata?.userId) {
        const isActive = ['active', 'trialing'].includes(status);
        await db.query(
          `UPDATE users
           SET plan = $1, is_locked = $2, updated_at = NOW()
           WHERE stripe_subscription_id = $3`,
          [isActive ? plan : 'free', !isActive, sub.id]
        );
      }
      break;
    }

    case 'customer.subscription.deleted': {
      // Subscription cancelled — downgrade to free
      const sub = event.data.object;
      await db.query(
        `UPDATE users
         SET plan = 'free', is_locked = FALSE,
             stripe_subscription_id = NULL, updated_at = NOW()
         WHERE stripe_subscription_id = $1`,
        [sub.id]
      );
      break;
    }

    case 'invoice.payment_failed': {
      // Payment failed — lock account after grace period
      const invoice = event.data.object;
      const subId   = invoice.subscription;
      if (subId) {
        await db.query(
          `UPDATE users SET is_locked = TRUE, updated_at = NOW()
           WHERE stripe_subscription_id = $1`,
          [subId]
        );
      }
      break;
    }
  }

  // Mark event as processed
  await db.query(
    'UPDATE stripe_events SET processed = TRUE WHERE id = $1', [event.id]
  );

  return { processed: true, type: event.type };
};

module.exports = { createCheckoutSession, createPortalSession, handleWebhook };
