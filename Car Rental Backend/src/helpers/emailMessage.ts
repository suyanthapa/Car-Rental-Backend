import env from "./config";
export enum EmailTopic {
  ForgotPassword = "forgot-password",
  VerifyEmail = "verify-email",
}

interface HtmlProps {
  token: string;
  username: string;
  topic: EmailTopic;
  userId?: string | number;
}

const message = (topic: EmailTopic, token: string): string => {
  switch (topic) {
    case EmailTopic.ForgotPassword:
      return `You requested to reset your password. Use the token below to complete the process:\n\n${token}`;
    case EmailTopic.VerifyEmail:
      return `Thank you for signing up! Use the following token to verify your email address:\n\n${token}`;
    default:
      return token;
  }
};

const subject = (topic: EmailTopic): string => {
  switch (topic) {
    case EmailTopic.ForgotPassword:
      return "🔒 Reset Your Password";
    case EmailTopic.VerifyEmail:
      return "📩 Verify Your Email";
    default:
      return "Notification";
  }
};

const html = ({ token, topic, username }: HtmlProps): string => {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${subject(topic)}</title>
  </head>
  <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f4f6f8;">
    <table width="100%" cellspacing="0" cellpadding="0" border="0" style="padding:40px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="20" cellspacing="0" border="0" style="background:#ffffff; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <tr>
              <td align="center" style="border-bottom:1px solid #eee; padding:30px;">
                <h2 style="margin:0; color:#333;">${subject(topic)}</h2>
              </td>
            </tr>
            
            <!-- Body -->
            <tr>
              <td style="padding:30px; color:#555; font-size:16px; line-height:1.6;">
                <p>Dear ${username},</p>
                <p>${message(topic, token)}</p>

                <p style="font-size:24px; font-weight:bold; text-align:center; margin:30px 0;">${token}</p>

              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td align="center" style="border-top:1px solid #eee; padding:20px; font-size:14px; color:#999;">
                <p>Thank you,<br /><b>The Car Rental Team</b></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

export default html;
