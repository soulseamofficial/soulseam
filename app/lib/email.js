/**
 * Email service utility for sending transactional emails
 * Supports multiple email providers (Resend, SendGrid, Nodemailer, etc.)
 */

/**
 * Send OTP email via configured email service
 * @param {string} to - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendOTPEmail(to, otp) {
  try {
    // Option 1: Resend (recommended for production)
    if (process.env.RESEND_API_KEY) {
      return await sendViaResend(to, otp);
    }

    // Option 2: SendGrid
    if (process.env.SENDGRID_API_KEY) {
      return await sendViaSendGrid(to, otp);
    }

    // Option 3: Nodemailer (SMTP)
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      return await sendViaSMTP(to, otp);
    }

    // Development/Testing: Log OTP (remove in production)
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV] Email OTP for ${to}: ${otp}`);
      return { success: true };
    }

    // No email service configured
    console.warn("No email service configured. Set RESEND_API_KEY, SENDGRID_API_KEY, or SMTP credentials.");
    return { success: false, error: "Email service not configured" };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send email via Resend API
 */
async function sendViaResend(to, otp) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || "SoulSeam <noreply@soulseam.com>",
      to: [to],
      subject: "Verify your SoulSeam account",
      html: getOTPEmailHTML(otp),
      text: getOTPEmailText(otp),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to send email via Resend");
  }

  return { success: true };
}

/**
 * Send email via SendGrid API
 */
async function sendViaSendGrid(to, otp) {
  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: to }],
          subject: "Verify your SoulSeam account",
        },
      ],
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || "noreply@soulseam.com",
        name: "SoulSeam",
      },
      content: [
        {
          type: "text/html",
          value: getOTPEmailHTML(otp),
        },
        {
          type: "text/plain",
          value: getOTPEmailText(otp),
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to send email via SendGrid");
  }

  return { success: true };
}

/**
 * Send email via SMTP (Nodemailer)
 * Note: Requires nodemailer package
 */
async function sendViaSMTP(to, otp) {
  // This would require nodemailer package
  // For now, we'll log a warning
  console.warn("SMTP email sending requires nodemailer package. Please install it or use Resend/SendGrid.");
  return { success: false, error: "SMTP not implemented. Please use Resend or SendGrid." };
}

/**
 * Generate HTML email template for OTP
 */
function getOTPEmailHTML(otp) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify your SoulSeam account</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h1 style="color: #000; margin-top: 0; font-size: 24px; font-weight: bold;">Verify your SoulSeam account</h1>
        <p style="color: #666; font-size: 16px; margin: 20px 0;">Your verification code is:</p>
        <div style="background-color: #f8f9fa; border: 2px solid #e9ecef; border-radius: 6px; padding: 20px; text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #000; font-family: 'Courier New', monospace;">${otp}</span>
        </div>
        <p style="color: #666; font-size: 14px; margin: 20px 0;">This code is valid for <strong>5 minutes</strong>. Please do not share it with anyone.</p>
        <p style="color: #999; font-size: 12px; margin-top: 40px; border-top: 1px solid #e9ecef; padding-top: 20px;">If you didn't request this code, please ignore this email.</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate plain text email for OTP
 */
function getOTPEmailText(otp) {
  return `
Verify your SoulSeam account

Your verification code is: ${otp}

This code is valid for 5 minutes. Please do not share it with anyone.

If you didn't request this code, please ignore this email.
  `.trim();
}
