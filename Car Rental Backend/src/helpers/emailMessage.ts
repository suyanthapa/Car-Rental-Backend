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
      return `We received a request to reset your password. Please use the verification code below to complete the process.`;
    case EmailTopic.VerifyEmail:
      return `Welcome! We're excited to have you on board. Please verify your email address using the code below.`;
    default:
      return token;
  }
};

const subject = (topic: EmailTopic): string => {
  switch (topic) {
    case EmailTopic.ForgotPassword:
      return "Reset Your Password";
    case EmailTopic.VerifyEmail:
      return "Verify Your Email Address";
    default:
      return "Notification";
  }
};

const html = ({ token, topic, username }: HtmlProps): string => {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject(topic)}</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f5f5f5; padding: 40px 20px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
            
            <!-- Header with subtle gradient -->
           <tr>
              <td style="background-color: #1a1a1a; padding: 40px 30px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">
                  ${subject(topic)}
                </h1>
              </td>
            </tr>
            
            <!-- Body Content -->
            <tr>
              <td style="padding: 40px 30px;">
                <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                  Hello <strong>${username}</strong>,
                </p>
                
                <p style="margin: 0 0 30px; color: #6b7280; font-size: 15px; line-height: 1.6;">
                  ${message(topic, token)}
                </p>
                
                <!-- OTP Code Box -->
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center" style="padding: 20px 0;">
                      <div style="background-color: #f9fafb; border: 2px dashed #d1d5db; border-radius: 8px; padding: 24px; display: inline-block;">
                        <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">
                          Your Verification Code
                        </p>
                        <p style="margin: 0; color: #111827; font-size: 32px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                          ${token}
                        </p>
                      </div>
                    </td>
                  </tr>
                </table>
                
                <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                  This code will expire in <strong>10 minutes</strong>. If you didn't request this, please ignore this email.
                </p>
              </td>
            </tr>
            
            <!-- Divider -->
            <tr>
              <td style="padding: 0 30px;">
                <div style="height: 1px; background-color: #e5e7eb;"></div>
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td style="padding: 30px; text-align: center;">
                <p style="margin: 0 0 8px; color: #9ca3af; font-size: 13px; line-height: 1.5;">
                  Thank you for choosing Our Service! If you have any questions, feel free to contact our support team at
                  <a href="mailto:support@yourcompany.com" style="color: #667eea; text-decoration: none;">vehiclerental9@gmail.com</a>
                </p>
                <p style="margin: 0; color: #d1d5db; font-size: 12px;">
                  © ${new Date().getFullYear()} Vehicle Rental System. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
          
          <!-- Bottom spacing for mobile -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px;">
            <tr>
              <td style="padding: 20px 0; text-align: center;">
                <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                  This is an automated message, please do not reply to this email.
                </p>
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
