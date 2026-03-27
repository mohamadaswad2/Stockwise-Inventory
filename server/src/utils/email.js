/**
 * Email utility — Gmail SMTP, production-ready.
 * Uses 'gmail' service shorthand which handles host/port/TLS automatically.
 */
const nodemailer = require('nodemailer');

const getTransporter = () => nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,   // Gmail App Password (16 chars, no spaces)
  },
});

const FROM    = () => `"StockWise" <${process.env.SMTP_USER}>`;
const APP_URL = () => process.env.CLIENT_URL || 'http://localhost:3000';

const verifyEmailConfig = async () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[Email] SMTP not configured — emails disabled.');
    return false;
  }
  try {
    await getTransporter().verify();
    console.log('[Email] SMTP OK ✓', process.env.SMTP_USER);
    return true;
  } catch (err) {
    console.error('[Email] SMTP FAILED:', err.message);
    return false;
  }
};

const sendVerificationEmail = async (to, name, code) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[Email] No SMTP — OTP for', to, 'is:', code);
    return;
  }
  try {
    const info = await getTransporter().sendMail({
      from:    FROM(),
      to,
      subject: `${code} — Your StockWise verification code`,
      html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1);">
<tr><td style="background:linear-gradient(135deg,#0ea5e9,#2563eb);padding:32px;text-align:center;">
  <div style="font-size:36px;">📦</div>
  <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:700;">StockWise</h1>
</td></tr>
<tr><td style="padding:40px;">
  <p style="color:#0f172a;font-size:16px;margin:0 0 8px;">Hi <strong>${name}</strong>,</p>
  <p style="color:#64748b;font-size:14px;margin:0 0 32px;">Enter this code to verify your email:</p>
  <div style="background:#f8fafc;border:2px dashed #0ea5e9;border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;">
    <span style="font-size:48px;font-weight:900;letter-spacing:14px;color:#0ea5e9;font-family:'Courier New',monospace;">${code}</span>
  </div>
  <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">Expires in 15 minutes. If you didn't sign up, ignore this.</p>
</td></tr>
<tr><td style="background:#f8fafc;padding:16px 40px;text-align:center;border-top:1px solid #e2e8f0;">
  <p style="margin:0;color:#cbd5e1;font-size:11px;">© 2024 StockWise</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`,
      text: `StockWise verification code: ${code}\n\nExpires in 15 minutes.`,
    });
    console.log('[Email] Sent to:', to, '| id:', info.messageId);
  } catch (err) {
    console.error('[Email] Send failed to', to, ':', err.message);
    throw err;
  }
};

const sendExpiryWarning = async (to, name, expiryDate, plan) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;
  try {
    await getTransporter().sendMail({
      from:    FROM(),
      to,
      subject: `⚠️ Your StockWise ${plan} plan expires in 3 days`,
      html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;">
<tr><td style="background:#f59e0b;padding:24px;text-align:center;">
  <h1 style="margin:0;color:#fff;font-size:20px;">⚠️ Subscription Expiring Soon</h1>
</td></tr>
<tr><td style="padding:32px 40px;">
  <p style="color:#0f172a;">Hi <strong>${name}</strong>,</p>
  <p style="color:#64748b;font-size:14px;">Your <strong>${plan}</strong> plan expires on <strong>${new Date(expiryDate).toLocaleDateString('en-MY',{day:'numeric',month:'long',year:'numeric'})}</strong>.</p>
  <p style="color:#64748b;font-size:14px;">Your data will be <strong>locked</strong> (not deleted) after expiry.</p>
  <div style="text-align:center;margin:28px 0;">
    <a href="${APP_URL()}/settings/billing" style="background:#0ea5e9;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block;">Renew Now →</a>
  </div>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`,
    });
    console.log('[Email] Expiry warning sent to:', to);
  } catch (err) {
    console.error('[Email] Expiry warning failed:', err.message);
  }
};

module.exports = { sendVerificationEmail, sendExpiryWarning, verifyEmailConfig };