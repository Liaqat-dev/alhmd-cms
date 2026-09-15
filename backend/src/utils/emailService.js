const { BrevoClient } = require('@getbrevo/brevo');
const { INSTITUTE_NAME, INSTITUTE_TAG } = require('../config/constants');

const brevo = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });

const appName = () => INSTITUTE_NAME;
// FRONTEND_URL is a comma-separated CORS allowlist (staff + student origins
// together) — not usable as-is for building a link into one specific portal.
// Each portal gets its own single-origin env var instead.
const staffFrontendUrl = () => process.env.STAFF_FRONTEND_URL || 'http://localhost:5173';
const studentFrontendUrl = () => process.env.STUDENT_FRONTEND_URL || 'http://localhost:5174';
const senderEmail = () => process.env.EMAIL_FROM || 'no-reply@brevo.com';
const sender = () => ({ name: appName(), email: senderEmail() });

// Verification is a staff-only (admin/teacher) flow — students are added by
// an admin and never self-verify an email.
const sendVerificationEmail = async (email, name, verificationToken) => {
  const verifyUrl = `${staffFrontendUrl()}/verify-email?token=${verificationToken}`;

  await brevo.transactionalEmails.sendTransacEmail({
    sender: sender(),
    to: [{ email }],
    subject: `Verify your ${appName()} account`,
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
          <tr><td align="center">
            <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
              <tr>
                <td style="background:#1e40af;padding:32px 40px;">
                  <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">${appName()}</h1>
                  <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">${INSTITUTE_TAG}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:40px;">
                  <h2 style="margin:0 0 16px;color:#111827;font-size:20px;">Verify your email address</h2>
                  <p style="margin:0 0 8px;color:#374151;font-size:15px;">Hello <strong>${name}</strong>,</p>
                  <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
                    Your account has been created. Click the button below to verify your email address and activate your account.
                  </p>
                  <a href="${verifyUrl}"
                     style="display:inline-block;background:#1e40af;color:#ffffff;padding:13px 28px;border-radius:6px;text-decoration:none;font-size:15px;font-weight:600;">
                    Verify Email Address
                  </a>
                  <p style="margin:24px 0 8px;color:#6b7280;font-size:13px;">Or copy this link into your browser:</p>
                  <p style="margin:0 0 24px;word-break:break-all;color:#1e40af;font-size:13px;">${verifyUrl}</p>
                  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
                  <p style="margin:0;color:#9ca3af;font-size:12px;">
                    This link expires in <strong>24 hours</strong>. If you did not expect this email, you can safely ignore it.
                  </p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  });
};

const sendPasswordResetNotification = async (email, name) => {
  await brevo.transactionalEmails.sendTransacEmail({
    sender: sender(),
    to: [{ email }],
    subject: `Your ${appName()} password was reset`,
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
          <tr><td align="center">
            <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
              <tr>
                <td style="background:#1e40af;padding:32px 40px;">
                  <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">${appName()}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:40px;">
                  <h2 style="margin:0 0 16px;color:#111827;font-size:20px;">Password reset notification</h2>
                  <p style="margin:0 0 16px;color:#374151;font-size:15px;">Hello <strong>${name}</strong>,</p>
                  <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
                    Your password has been reset by an administrator. Please log in and change it as soon as possible.
                  </p>
                  <p style="margin:0;color:#9ca3af;font-size:12px;">
                    If you did not expect this change, contact your school administrator immediately.
                  </p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  });
};

// `portal` picks which frontend the reset link points at — 'staff' for the
// admin/teacher forgot-password flow, 'student' for the student one. The
// same token works against either portal's /reset-password page since
// resetPasswordWithToken is shared, but the link must land the person on
// the app they actually use.
const sendPasswordResetEmail = async (email, name, resetToken, portal = 'staff') => {
  const base = portal === 'student' ? studentFrontendUrl() : staffFrontendUrl();
  const resetUrl = `${base}/reset-password?token=${resetToken}`;

  await brevo.transactionalEmails.sendTransacEmail({
    sender: sender(),
    to: [{ email }],
    subject: `Reset your ${appName()} password`,
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
          <tr><td align="center">
            <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
              <tr>
                <td style="background:#1e40af;padding:32px 40px;">
                  <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">${appName()}</h1>
                  <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">${INSTITUTE_TAG}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:40px;">
                  <h2 style="margin:0 0 16px;color:#111827;font-size:20px;">Reset your password</h2>
                  <p style="margin:0 0 8px;color:#374151;font-size:15px;">Hello <strong>${name}</strong>,</p>
                  <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
                    We received a request to reset your password. Click the button below to choose a new one.
                  </p>
                  <a href="${resetUrl}"
                     style="display:inline-block;background:#1e40af;color:#ffffff;padding:13px 28px;border-radius:6px;text-decoration:none;font-size:15px;font-weight:600;">
                    Reset Password
                  </a>
                  <p style="margin:24px 0 8px;color:#6b7280;font-size:13px;">Or copy this link into your browser:</p>
                  <p style="margin:0 0 24px;word-break:break-all;color:#1e40af;font-size:13px;">${resetUrl}</p>
                  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
                  <p style="margin:0 0 8px;color:#9ca3af;font-size:12px;">
                    This link expires in <strong>1 hour</strong>.
                  </p>
                  <p style="margin:0;color:#9ca3af;font-size:12px;">
                    If you did not request a password reset, you can safely ignore this email. Your password will not change.
                  </p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  });
};

module.exports = { sendVerificationEmail, sendPasswordResetNotification, sendPasswordResetEmail };
