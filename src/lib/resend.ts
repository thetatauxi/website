import { Resend } from 'resend';

interface SendSetupEmailParams {
  to: string;
  setupUrl: string;
  username?: string;
  isReset?: boolean;
}

/**
 * Sends a modern, chapter-branded HTML invitation or password reset email via Resend
 */
export async function sendSetupEmail({
  to,
  setupUrl,
  username,
  isReset = false,
}: SendSetupEmailParams): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: 'RESEND_API_KEY is not configured in your environment variables (.env.local).',
    };
  }

  const fromEmail =
    process.env.RESEND_FROM_EMAIL ||
    'Theta Tau <onboarding@resend.dev>'; // Default fallback if custom domain is not yet configured

  const resend = new Resend(apiKey);

  const subject = isReset
    ? 'Reset Your Theta Tau Account Password'
    : 'Welcome to Theta Tau – Set Up Your Member Account';

  const actionTitle = isReset ? 'Reset Your Password' : 'Set Up Your Profile & Password';
  const headingText = isReset ? 'Account Password Reset' : 'Welcome to Theta Tau!';
  const messageText = isReset
    ? `A password reset and profile update link was requested for your account (${username || to}). Click the button below to choose a new password and update your information:`
    : `You have been added to the Theta Tau – Xi Chapter member registry. Click the button below to activate your account, set your password, and finish setting up your member profile:`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e4e4e7; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);" cellspacing="0" cellpadding="0">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #881337; padding: 28px 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">THETA TAU</h1>
              <p style="margin: 4px 0 0 0; color: #fecdd3; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px;">Xi Chapter &bull; UW–Madison</p>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 36px 32px 28px 32px;">
              <h2 style="margin: 0 0 16px 0; color: #09090b; font-size: 20px; font-weight: 700;">
                ${headingText}
              </h2>
              <p style="margin: 0 0 24px 0; color: #52525b; font-size: 15px; line-height: 1.6;">
                ${messageText}
              </p>

              <!-- Call to Action Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center" style="border-radius: 10px; background-color: #991b1b;">
                    <a href="${setupUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 10px; background-color: #991b1b;">
                      ${actionTitle} &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback Direct Link -->
              <div style="margin-top: 24px; padding: 14px 16px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #64748b;">
                  Or copy and paste this link into your browser:
                </p>
                <a href="${setupUrl}" target="_blank" style="font-size: 11px; font-family: monospace; color: #991b1b; word-break: break-all; text-decoration: underline;">
                  ${setupUrl}
                </a>
              </div>

              <!-- Security Scanner Resilience Note -->
              <p style="margin: 28px 0 0 0; font-size: 12px; color: #71717a; line-height: 1.5; border-top: 1px solid #f4f4f5; padding-top: 18px;">
                <strong>Security note:</strong> This setup link is protected against automated campus email scanners. It will remain active until you submit your password on the setup page.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 20px 32px; border-top: 1px solid #f4f4f5; text-align: center;">
              <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
                Theta Tau Xi Chapter &bull; University of Wisconsin–Madison
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error('Resend dispatch error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown Resend error';
    console.error('Failed to send email via Resend:', msg);
    return { success: false, error: msg };
  }
}
