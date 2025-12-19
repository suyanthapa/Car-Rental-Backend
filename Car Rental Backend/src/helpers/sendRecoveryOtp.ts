import nodemailer from "nodemailer";
import html, { EmailTopic } from "./emailMessage";
import env from "./config";
import SMTPTransport from "nodemailer/lib/smtp-transport";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT),
  secure: Number(env.SMTP_PORT) === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
} as SMTPTransport.Options);

function generateToken(): string {
  return (100000 + Math.floor(Math.random() * 900000)).toString();
}

export async function sendEmail(
  to: string,
  subject: string,
  htmlMsg: string
): Promise<any> {
  try {
    console.log("Sending email to:", to);
    const info = await transporter.sendMail({
      from: `"Car Rental" <${env.GMAIL_USER}>`,
      to,
      subject,
      html: htmlMsg,
    });

    console.log("Message sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Email service failure");
  }
}

export async function sendEmailToken(
  userEmail: string,
  username: string,
  topic: EmailTopic,
  userId?: string | number
): Promise<string> {
  const token = generateToken();
  console.log("Generated Token:", userId);

  const htmlMsg = html({
    token,
    topic,
    username,
    userId,
  });

  await sendEmail(userEmail, topic, htmlMsg);
  return token;
}
