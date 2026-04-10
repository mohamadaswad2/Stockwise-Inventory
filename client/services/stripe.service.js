import api from './api';

// Redirect to Stripe Checkout hosted page
export const createCheckoutSession = async (plan) => {
  const res = await api.post('/stripe/create-checkout-session', { plan });
  return res.data.data; // { url, sessionId }
};

// Redirect to Stripe Customer Portal (manage/cancel)
export const createPortalSession = async () => {
  const res = await api.post('/stripe/create-portal-session');
  return res.data.data; // { url }
};
