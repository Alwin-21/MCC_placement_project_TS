import nodemailer from "nodemailer";
import fs from "fs/promises";
import path from "path";

export async function sendEmail(toEmail: string, subject: string, body: string): Promise<void> {
  // 1. Log to local file as backup
  try {
    const logPath = path.join(process.cwd(), "sent-emails.txt");
    const emailContent = `\n========================================\n` +
                         `DATE: ${new Date().toISOString()}\n` +
                         `TO: ${toEmail}\n` +
                         `SUBJECT: ${subject}\n` +
                         `BODY:\n${body}\n` +
                         `========================================\n`;
    await fs.appendFile(logPath, emailContent, "utf-8");
    console.log(`[EMAIL LOGGED] To: ${toEmail}`);
  } catch (ex: any) {
    console.error(`[EMAIL FILE LOG ERROR] Failed to log email: ${ex.message}`);
  }

  // 2. Send actual email via SMTP
  try {
    const smtpServer = process.env.SMTP_SERVER || "smtp.gmail.com";
    const port = parseInt(process.env.SMTP_PORT || "587", 10);
    const senderEmail = process.env.SMTP_SENDER_EMAIL || "alwinrosh@gmail.com";
    const senderName = process.env.SMTP_SENDER_NAME || "MCC Placement Cell";
    const username = process.env.SMTP_USERNAME || "alwinrosh@gmail.com";
    const password = process.env.SMTP_PASSWORD || "pwimgfufetjtgfob";

    const transporter = nodemailer.createTransport({
      host: smtpServer,
      port: port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user: username,
        pass: password,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: toEmail,
      subject: subject,
      text: body,
    });

    console.log(`[EMAIL SENT SUCCESSFULLY] To: ${toEmail}`);
  } catch (ex: any) {
    console.error(`[EMAIL SMTP ERROR] Failed to send email via SMTP to ${toEmail}: ${ex.message}`);
  }
}
