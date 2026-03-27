/**
 * Email utility — sends transactional emails via SMTP (Gmail/Brevo/etc)
 */
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = `"StockWise" <${process.env.SMTP_USER}>`;
const APP_URL = process.env.CLIENT_URL || 'http://localhost:3000';

/**
 * Send email verification code to new user
 */
const sendVerificationEmail = async (email, name, code) => {
  await transporter.sendMail({
    from:    FROM,
    to:      email,
    subject: `${code} — Verify your StockWise account`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:#0ea5e9;border-radius:12px;margin-bottom:12px;">
            <span style="color:white;font-size:20px;">📦</span>
          </div>
          <h1 style="font-size:22px;font-weight:700;color:#0f172a;margin:0;">StockWise</h1>
        </div>
        <div style="background:white;border-radius:12px;padding:28px;border:1px solid #e2e8f0;">
          <p style="color:#0f172a;font-size:15px;margin:0 0 8px;">Hi ${name},</p>
          <p style="color:#64748b;font-size:14px;margin:0 0 24px;">Your verification code is:</p>
          <div style="text-align:center;margin:24px 0;">
            <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#0ea5e9;font-family:monospace;">${code}</span>
          </div>
          <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">This code expires in <strong>15 minutes</strong>.</p>
        </div>
        <p style="color:#cbd5e1;font-size:11px;text-align:center;margin-top:20px;">If you didn't create a StockWise account, ignore this email.</p>
      </div>
    `,
  });
};

/**
 * Send subscription expiry warning (3 days before)
 */
const sendExpiryWarning = async (email, name, expiryDate, plan) => {
  await transporter.sendMail({
    from:    FROM,
    to:      email,
    subject: `⚠️ Your StockWise ${plan} plan expires in 3 days`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px;">
        <h2 style="color:#f59e0b;">Subscription Expiring Soon</h2>
        <p>Hi ${name},</p>
        <p>Your <strong>${plan}</strong> plan expires on <strong>${new Date(expiryDate).toLocaleDateString('en-MY')}</strong>.</p>
        <p>After expiry, your data will be <strong>locked</strong> (not deleted) until you renew.</p>
        <a href="${APP_URL}/settings/billing" style="display:inline-block;background:#0ea5e9;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">
          Renew Now →
        </a>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px;">Your data is safe and will be restored immediately upon renewal.</p>
      </div>
    `,
  });
};

module.exports = { sendVerificationEmail, sendExpiryWarning };
