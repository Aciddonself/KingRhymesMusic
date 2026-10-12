import nodemailer from "nodemailer";

export function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD && process.env.SMTP_FROM);
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM;
  const port = Number(process.env.SMTP_PORT || 587);
  if (!host || !user || !password || !from || !Number.isInteger(port)) {
    throw new Error("SMTP password-reset delivery is not configured");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass: password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  await transporter.sendMail({
    from,
    to,
    subject: "Reset your King Rhymes password",
    text: `Use this link to reset your password. It expires in 30 minutes: ${resetUrl}`,
    html: `<div style="background:#0a0a0a;color:#f5f1e6;padding:32px;font-family:Arial,sans-serif"><p style="color:#d4af37;text-transform:uppercase;letter-spacing:3px">King Rhymes</p><h1 style="font-size:26px">Reset your password</h1><p>This secure link expires in 30 minutes. If you did not request a reset, you can ignore this email.</p><p><a href="${resetUrl}" style="display:inline-block;background:#d4af37;color:#0a0a0a;padding:13px 20px;text-decoration:none;font-weight:bold;border-radius:8px">Choose a new password</a></p><p style="color:#a8a29a;font-size:12px">If the button does not work, open this link:<br>${resetUrl}</p></div>`,
  });
}