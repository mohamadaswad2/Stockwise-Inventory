const BREVO_API = 'https://api.brevo.com/v3/smtp/email';
const FROM_NAME = 'StockWise';

const sendEmail = async ({ to, toName, subject, html, text }) => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn('[Email] No BREVO_API_KEY — skipping. Content:', subject);
    return;
  }
  const res = await fetch(BREVO_API, {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      sender:      { name: FROM_NAME, email: process.env.SMTP_USER || 'noreply@stockwise.app' },
      to:          [{ email: to, name: toName || to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });
  if (!res.ok) { const e = await res.text(); throw new Error(`Brevo ${res.status}: ${e}`); }
  const data = await res.json();
  console.log('[Email] Sent:', subject, '→', to, '| id:', data.messageId);
  return data;
};

const verifyEmailConfig = async () => {
  if (!process.env.BREVO_API_KEY) {
    console.warn('[Email] BREVO_API_KEY not set — emails disabled.');
    return false;
  }
  console.log('[Email] Brevo API configured ✓');
  return true;
};

const sendVerificationEmail = async (to, name, code) => {
  return sendEmail({
    to, toName: name,
    subject: `${code} — Verify your StockWise account`,
    html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0a0f;font-family:Inter,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 16px;">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background:#13131a;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
<tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6,#a855f7);padding:36px;text-align:center;">
  <div style="font-size:40px;margin-bottom:8px;">📦</div>
  <h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">StockWise</h1>
  <p style="margin:6px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">Inventory Management</p>
</td></tr>
<tr><td style="padding:40px;">
  <p style="color:#e2e8f0;font-size:16px;margin:0 0 8px;">Hi <strong>${name}</strong>,</p>
  <p style="color:#94a3b8;font-size:14px;margin:0 0 32px;line-height:1.6;">Your email verification code is:</p>
  <div style="background:#1e1e2e;border:2px solid #6366f1;border-radius:16px;padding:28px;text-align:center;margin-bottom:28px;">
    <span style="font-size:44px;font-weight:900;letter-spacing:12px;color:#a78bfa;font-family:'Courier New',monospace;">${code}</span>
  </div>
  <p style="color:#64748b;font-size:12px;text-align:center;margin:0;">⏱ Expires in <strong style="color:#94a3b8;">15 minutes</strong></p>
</td></tr>
<tr><td style="background:#0d0d14;padding:20px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
  <p style="margin:0;color:#475569;font-size:11px;">© 2024 StockWise · If you didn't sign up, ignore this.</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`,
    text: `StockWise verification code: ${code}\n\nExpires in 15 minutes.`,
  });
};

const sendPasswordResetEmail = async (to, name, resetUrl) => {
  return sendEmail({
    to, toName: name,
    subject: 'Reset your StockWise password',
    html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0a0f;font-family:Inter,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 16px;">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background:#13131a;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
<tr><td style="background:linear-gradient(135deg,#3b82f6,#6366f1);padding:36px;text-align:center;">
  <div style="font-size:36px;margin-bottom:8px;">🔐</div>
  <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;">Password Reset</h1>
</td></tr>
<tr><td style="padding:40px;">
  <p style="color:#e2e8f0;font-size:15px;margin:0 0 8px;">Hi <strong>${name}</strong>,</p>
  <p style="color:#94a3b8;font-size:14px;margin:0 0 28px;line-height:1.6;">
    We received a request to reset your password. Click below to choose a new one.
  </p>
  <div style="text-align:center;margin:28px 0;">
    <a href="${resetUrl}" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:16px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
      Reset Password →
    </a>
  </div>
  <p style="color:#64748b;font-size:12px;text-align:center;margin:0;">
    Link expires in <strong style="color:#94a3b8;">1 hour</strong>.<br>
    If you didn't request this, you can safely ignore this email.
  </p>
</td></tr>
<tr><td style="background:#0d0d14;padding:20px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
  <p style="margin:0;color:#475569;font-size:11px;">© 2024 StockWise</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`,
    text: `Reset your StockWise password: ${resetUrl}\n\nExpires in 1 hour.`,
  });
};

const sendExpiryWarning = async (to, name, expiryDate, plan) => {
  const appUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  return sendEmail({
    to, toName: name,
    subject: `⚠️ Your StockWise ${plan} plan expires in 3 days`,
    html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0a0f;font-family:Inter,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 16px;">
<tr><td align="center">
<table width="480" cellpadding="0" cellspacing="0" style="background:#13131a;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
<tr><td style="background:linear-gradient(135deg,#f59e0b,#ef4444);padding:32px;text-align:center;">
  <h1 style="margin:0;color:#fff;font-size:20px;font-weight:800;">⚠️ Subscription Expiring</h1>
</td></tr>
<tr><td style="padding:36px 40px;">
  <p style="color:#e2e8f0;">Hi <strong>${name}</strong>,</p>
  <p style="color:#94a3b8;font-size:14px;line-height:1.6;">Your <strong style="color:#e2e8f0;">${plan}</strong> plan expires on <strong style="color:#e2e8f0;">${new Date(expiryDate).toLocaleDateString('en-MY',{day:'numeric',month:'long',year:'numeric'})}</strong>.</p>
  <p style="color:#94a3b8;font-size:14px;">Your data will be <strong style="color:#fbbf24;">locked</strong> (not deleted) after expiry.</p>
  <div style="text-align:center;margin:28px 0;">
    <a href="${appUrl}/settings/billing" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block;">Renew Now →</a>
  </div>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`,
    text: `Your ${plan} plan expires soon. Renew at ${appUrl}/settings/billing`,
  });
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendExpiryWarning, verifyEmailConfig };
