const BREVO_API = 'https://api.brevo.com/v3/smtp/email';
const FROM_NAME = 'StockWise';

const sendEmail = async ({ to, toName, subject, html, text }) => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn('[Email] No BREVO_API_KEY — skipping:', subject);
    return;
  }
  const res = await fetch(BREVO_API, {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      sender:      { name: FROM_NAME, email: process.env.SMTP_USER || 'noreply@stockwise.app' },
      to:          [{ email: to, name: toName || to }],
      subject, htmlContent: html, textContent: text,
    }),
  });
  if (!res.ok) { const e = await res.text(); throw new Error(`Brevo ${res.status}: ${e}`); }
  const data = await res.json();
  console.log('[Email] Sent:', subject, '→', to);
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
<tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:36px;text-align:center;">
  <div style="font-size:40px;margin-bottom:8px;">📦</div>
  <h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;">StockWise</h1>
</td></tr>
<tr><td style="padding:40px;">
  <p style="color:#e2e8f0;font-size:16px;margin:0 0 8px;">Hi <strong>${name}</strong>,</p>
  <p style="color:#94a3b8;font-size:14px;margin:0 0 32px;">Your verification code:</p>
  <div style="background:#1e1e2e;border:2px solid #6366f1;border-radius:16px;padding:28px;text-align:center;margin-bottom:28px;">
    <span style="font-size:44px;font-weight:900;letter-spacing:12px;color:#a78bfa;font-family:'Courier New',monospace;">${code}</span>
  </div>
  <p style="color:#64748b;font-size:12px;text-align:center;">⏱ Expires in 15 minutes</p>
</td></tr>
<tr><td style="background:#0d0d14;padding:16px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
  <p style="margin:0;color:#475569;font-size:11px;">© 2024 StockWise</p>
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
<tr><td style="background:linear-gradient(135deg,#3b82f6,#6366f1);padding:32px;text-align:center;">
  <div style="font-size:32px;">🔐</div>
  <h1 style="margin:8px 0 0;color:#fff;font-size:20px;font-weight:800;">Password Reset</h1>
</td></tr>
<tr><td style="padding:36px 40px;">
  <p style="color:#e2e8f0;">Hi <strong>${name}</strong>,</p>
  <p style="color:#94a3b8;font-size:14px;line-height:1.6;">Click the button below to reset your password.</p>
  <div style="text-align:center;margin:28px 0;">
    <a href="${resetUrl}" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:16px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block;">Reset Password →</a>
  </div>
  <p style="color:#64748b;font-size:12px;text-align:center;">Expires in 1 hour. If you didn't request this, ignore this email.</p>
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
<tr><td style="background:linear-gradient(135deg,#f59e0b,#ef4444);padding:28px;text-align:center;">
  <h1 style="margin:0;color:#fff;font-size:20px;font-weight:800;">⚠️ Subscription Expiring</h1>
</td></tr>
<tr><td style="padding:32px 40px;">
  <p style="color:#e2e8f0;">Hi <strong>${name}</strong>,</p>
  <p style="color:#94a3b8;font-size:14px;">Your <strong style="color:#e2e8f0;">${plan}</strong> plan expires on <strong style="color:#e2e8f0;">${new Date(expiryDate).toLocaleDateString('en-MY',{day:'numeric',month:'long',year:'numeric'})}</strong>.</p>
  <p style="color:#94a3b8;font-size:14px;">Your data will be <strong style="color:#fbbf24;">locked</strong> (not deleted) after expiry.</p>
  <div style="text-align:center;margin:24px 0;">
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

const sendLowStockAlert = async (to, name, items) => {
  const appUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const itemRows = items.slice(0, 10).map(item => `
    <tr>
      <td style="padding:10px 16px;color:#e2e8f0;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.06);">
        ${item.name}${item.sku ? ` <span style="color:#64748b;font-size:11px;">(${item.sku})</span>` : ''}
      </td>
      <td style="padding:10px 16px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
        <span style="background:${item.quantity === 0 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)'};
                     color:${item.quantity === 0 ? '#f87171' : '#fbbf24'};
                     padding:3px 10px;border-radius:99px;font-size:12px;font-weight:700;">
          ${item.quantity} ${item.unit}
        </span>
      </td>
      <td style="padding:10px 16px;text-align:center;color:#64748b;font-size:12px;border-bottom:1px solid rgba(255,255,255,0.06);">
        Min: ${item.threshold}
      </td>
    </tr>
  `).join('');

  return sendEmail({
    to, toName: name,
    subject: `⚠️ ${items.length} item${items.length !== 1 ? 's' : ''} running low — StockWise`,
    html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0a0f;font-family:Inter,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:48px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#13131a;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
<tr><td style="background:linear-gradient(135deg,#f59e0b,#f97316);padding:28px;text-align:center;">
  <div style="font-size:32px;">📦</div>
  <h1 style="margin:8px 0 0;color:#fff;font-size:20px;font-weight:800;">Low Stock Alert</h1>
  <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">${items.length} item${items.length!==1?'s':''} need restocking</p>
</td></tr>
<tr><td style="padding:24px 32px;">
  <p style="color:#94a3b8;font-size:14px;margin:0 0 20px;">Hi <strong style="color:#e2e8f0;">${name}</strong>, the following items are running low:</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a24;border-radius:12px;overflow:hidden;">
    <thead>
      <tr style="background:#22222f;">
        <th style="padding:10px 16px;text-align:left;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Item</th>
        <th style="padding:10px 16px;text-align:center;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Stock</th>
        <th style="padding:10px 16px;text-align:center;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Threshold</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>
  <div style="text-align:center;margin-top:24px;">
    <a href="${appUrl}/inventory?low_stock=true" style="background:linear-gradient(135deg,#f59e0b,#f97316);color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;display:inline-block;">View Low Stock Items →</a>
  </div>
</td></tr>
<tr><td style="background:#0d0d14;padding:16px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
  <p style="margin:0;color:#475569;font-size:11px;">© 2024 StockWise · You receive this because you're on a paid plan.</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`,
    text: `Low Stock Alert: ${items.length} items need restocking. Visit ${appUrl}/inventory?low_stock=true`,
  });
};

module.exports = {
  sendVerificationEmail, sendPasswordResetEmail,
  sendExpiryWarning, sendLowStockAlert, verifyEmailConfig,
};
