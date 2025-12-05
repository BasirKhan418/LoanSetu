import ConnectEmailClient from "../middleware/connectEmailClient";

interface SendOtpEmailParams {
  email: string;
  otp: string;
  name?: string; // optional, for personalization
}

export const sendAdminOtpEmail = async ({ email, otp, name }: SendOtpEmailParams) => {
  try {
    const emailTransporter = await ConnectEmailClient();

    if (!emailTransporter) {
      return { message: "Failed to connect to email client", success: false };
    }

    const subject = "Admin OTP for LoanSetu";
    const title = "Admin Access Verification";
    const greeting = name ? `Hello ${name},` : "Hello,";

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>${subject}</title>
      </head>
      <body style="margin:0; padding:0; background-color:#f4f4f5; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5; padding:20px 0;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 8px 20px rgba(15,23,42,0.08);">
                <tr>
                  <td style="background:linear-gradient(135deg,#0f766e,#0ea5e9); padding:18px 24px; text-align:left;">
                    <h1 style="margin:0; font-size:20px; color:#ffffff; letter-spacing:0.03em;">
                      LoanSetu
                    </h1>
                    <p style="margin:4px 0 0; font-size:12px; color:rgba(255,255,255,0.85);">
                      Secure Admin Access
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:24px 24px 8px 24px;">
                    <h2 style="margin:0 0 12px 0; font-size:18px; color:#111827;">${title}</h2>
                    <p style="margin:0 0 8px 0; font-size:14px; color:#374151;">${greeting}</p>
                    <p style="margin:0 0 16px 0; font-size:14px; color:#4b5563; line-height:1.5;">
                      You are attempting to log in to the
                      <strong>LoanSetu Admin Dashboard</strong>. Use the OTP below
                      to verify your identity and complete your secure sign-in.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 24px 16px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb; border-radius:10px; border:2px solid #0ea5e9; text-align:center; padding:18px 12px;">
                      <tr>
                        <td>
                          <p style="margin:0; font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:0.14em;">
                            Your OTP Code
                          </p>
                          <p style="margin:10px 0 0 0; font-size:32px; font-weight:700; color:#0f172a; letter-spacing:0.28em;">
                            ${otp}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 24px 16px 24px;">
                    <p style="margin:0 0 8px 0; font-size:13px; color:#374151;">
                      <strong>This OTP will expire in 5 minutes.</strong>
                    </p>
                    <p style="margin:0 0 8px 0; font-size:13px; color:#6b7280;">
                      For your security, do not share this code with anyone. Our team will
                      <strong>never</strong> ask you for this OTP over call, SMS, WhatsApp, or email.
                    </p>
                    <p style="margin:0 0 16px 0; font-size:13px; color:#6b7280;">
                      If you did not try to log in, you can safely ignore this email.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 24px 24px 24px; border-top:1px solid #e5e7eb;">
                    <p style="margin:12px 0 4px 0; font-size:11px; color:#9ca3af;">
                      You’re receiving this email because your email address was used for an admin login attempt on LoanSetu.
                    </p>
                    <p style="margin:0; font-size:11px; color:#9ca3af;">
                      © ${new Date().getFullYear()} LoanSetu. All rights reserved.
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

    await emailTransporter.sendMail({
      from: `"LoanSetu" <${process.env.EMAIL_USER_V2}>`,
      to: email,
      subject,
      html,
      text: `LoanSetu Admin OTP: ${otp}\n\nThis OTP will expire in 5 minutes.\nDo not share this code with anyone.\nIf you did not request it, you can ignore this message.`,
    });

    console.log(`Admin OTP email sent successfully to ${email}`);
    return { message: `Admin OTP sent to ${email}`, success: true };
  } catch (error) {
    console.error("Error sending admin OTP email:", error);
    return { message: "Error sending OTP email", error, success: false };
  }
};
