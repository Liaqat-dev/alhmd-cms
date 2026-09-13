const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const appName = () => process.env.APP_NAME || 'CGA';
const frontendUrl = () => process.env.FRONTEND_URL || 'http://localhost:5173';
const fromAddress = () => process.env.EMAIL_FROM || `${appName()} <onboarding@resend.dev>`;

const sendVerificationEmail = async (email, name, verificationToken) => {
  const verifyUrl = `${frontendUrl()}/verify-email?token=${verificationToken}`;

  await resend.emails.send({
    from: fromAddress(),
    to: email,
    subject: `Verify your ${appName()} account`,
    html: `
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
                  <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">Cambridge Global Academy</p>
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
  await resend.emails.send({
    from: fromAddress(),
    to: email,
    subject: `Your ${appName()} password was reset`,
    html: `
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

const sendPasswordResetEmail = async (email, name, resetToken) => {
  const resetUrl = `${frontendUrl()}/reset-password?token=${resetToken}`;

  await resend.emails.send({
    from: fromAddress(),
    to: email,
    subject: `Reset your ${appName()} password`,
    html: `
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
                  <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">Cambridge Global Academy</p>
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
