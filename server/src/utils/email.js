/**
 * Email utility — uses Brevo HTTP API (not SMTP).
 * Railway blocks outbound SMTP ports, so we use fetch() instead.
 */

const BREVO_API = 'https://api.brevo.com/v3/smtp/email';
const FROM_NAME = 'stockwise';

const sendEmail = async ({ to, toName, subject, html, text }) => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn('[Email] BREVO_API_KEY not set — skipping send. For dev, OTP will be logged.');
    return;
  }

  const res = await fetch(BREVO_API, {
    method: 'POST',
    headers: {
      'api-key':     apiKey,
      'Content-Type': 'application/json',
      'Accept':       'application/json',
    },
    body: JSON.stringify({
      sender:   { name: FROM_NAME, email: process.env.SMTP_USER || 'noreply@stockwise.app' },
      to:       [{ email: to, name: toName || to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  console.log('[Email] Sent to:', to, '| messageId:', data.messageId);
  return data;
};

const verifyEmailConfig = async () => {
  if (!process.env.BREVO_API_KEY) {
    console.warn('[Email] BREVO_API_KEY not configured — emails disabled.');
    return false;
  }
  console.log('[Email] Brevo API configured ✓');
  return true;
};

const sendVerificationEmail = async (to, name, code) => {
  if (!process.env.BREVO_API_KEY) {
    console.warn('[Email] No API key — OTP for', to, 'is:', code);
    return;
  }
  return sendEmail({
    to, toName: name,
    subject: `${code} — Your StockWise verification code`,
    html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1);">
<tr><td style="background:linear-gradient(135deg,#007aff,#5856d6);padding:32px;text-align:center;">
  <div style="font-size:36px;">📦</div>
  <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:700;">StockWise</h1>
</td></tr>
<tr><td style="padding:40px;">
  <p style="color:#0f172a;font-size:16px;margin:0 0 8px;">Hi <strong>${name}</strong>,</p>
  <p style="color:#64748b;font-size:14px;margin:0 0 32px;">Enter this code to verify your email:</p>
  <div style="background:#f8fafc;border:2px dashed #007aff;border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;">
    <span style="font-size:48px;font-weight:900;letter-spacing:14px;color:#007aff;font-family:'Courier New',monospace;">${code}</span>
  </div>
  <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">Expires in 15 minutes. If you didn't sign up, ignore this.</p>
</td></tr>
<tr><td style="background:#f8fafc;padding:16px 40px;text-align:center;border-top:1px solid #e2e8f0;">
  <p style="margin:0;color:#cbd5e1;font-size:11px;">© 2024 StockWise. All rights reserved.</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`,
    text: `StockWise verification code: ${code}\n\nExpires in 15 minutes.`,
  });
};

const sendExpiryWarning = async (to, name, expiryDate, plan) => {
  if (!process.env.BREVO_API_KEY) return;
  const appUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  return sendEmail({
    to, toName: name,
    subject: `⚠️ Your StockWise ${plan} plan expires in 3 days`,
    html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;">
<tr><td style="background:#ff9500;padding:24px;text-align:center;">
  <h1 style="margin:0;color:#fff;font-size:20px;">⚠️ Subscription Expiring Soon</h1>
</td></tr>
<tr><td style="padding:32px 40px;">
  <p style="color:#0f172a;">Hi <strong>${name}</strong>,</p>
  <p style="color:#64748b;font-size:14px;">Your <strong>${plan}</strong> plan expires on <strong>${new Date(expiryDate).toLocaleDateString('en-MY', { day:'numeric', month:'long', year:'numeric' })}</strong>.</p>
  <p style="color:#64748b;font-size:14px;">Your data will be <strong>locked</strong> (not deleted) after expiry. Renew to restore access instantly.</p>
  <div style="text-align:center;margin:28px 0;">
    <a href="${appUrl}/settings/billing" style="background:#007aff;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block;">
      Renew Now →
    </a>
  </div>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`,
    text: `Your ${plan} plan expires on ${new Date(expiryDate).toLocaleDateString()}. Renew at ${appUrl}/settings/billing`,
  });
};

module.exports = { sendVerificationEmail, sendExpiryWarning, verifyEmailConfig };