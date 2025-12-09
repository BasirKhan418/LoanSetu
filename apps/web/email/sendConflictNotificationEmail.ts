import ConnectEmailClient from "../middleware/connectEmailClient";

interface ConflictEmailParams {
  adminEmail: string;
  adminName?: string;
  conflictData: {
    loanNumber: string;
    beneficiaryName: string;
    aiDecision: string;
    aiRiskScore?: number;
    officerDecision: string;
    officerName: string;
    bankName: string;
    conflictType: string;
    submissionId: string;
  };
}

export const sendConflictNotificationEmail = async ({ 
  adminEmail, 
  adminName, 
  conflictData 
}: ConflictEmailParams) => {
  try {
    console.log(`📧 Attempting to send conflict email to: ${adminEmail}`);
    
    const emailTransporter = await ConnectEmailClient();

    if (!emailTransporter) {
      console.error("❌ Email transporter is null - check EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD env variables");
      return { message: "Failed to connect to email client", success: false };
    }

    console.log("✅ Email transporter connected successfully");

    const subject = `⚠️ Conflict Alert: ${conflictData.loanNumber}`;
    const greeting = adminName ? `Hello ${adminName},` : "Hello Admin,";

    const conflictTypeLabel = 
      conflictData.conflictType === "AI_APPROVE_OFFICER_REJECT" 
        ? "AI Approved but Officer Rejected" 
        : conflictData.conflictType === "AI_REJECT_OFFICER_APPROVE"
        ? "AI Rejected but Officer Approved"
        : "Decision Conflict Detected";

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
                
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#dc2626,#ea580c); padding:18px 24px; text-align:left;">
                    <h1 style="margin:0; font-size:20px; color:#ffffff; letter-spacing:0.03em;">
                      🚨 LoanSetu Conflict Alert
                    </h1>
                    <p style="margin:4px 0 0; font-size:12px; color:rgba(255,255,255,0.85);">
                      Decision Conflict Detected
                    </p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding:24px 24px 8px 24px;">
                    <h2 style="margin:0 0 12px 0; font-size:18px; color:#111827;">Conflict of Interest Detected</h2>
                    <p style="margin:0 0 8px 0; font-size:14px; color:#374151;">${greeting}</p>
                    <p style="margin:0 0 16px 0; font-size:14px; color:#4b5563; line-height:1.5;">
                      A conflict has been detected between the AI decision and the officer's decision for the following loan application.
                    </p>
                  </td>
                </tr>

                <!-- Conflict Type Badge -->
                <tr>
                  <td style="padding:0 24px 16px 24px;">
                    <div style="background-color:#fef2f2; border-left:4px solid #dc2626; padding:12px 16px; border-radius:6px;">
                      <p style="margin:0; font-size:13px; font-weight:600; color:#991b1b;">
                        ${conflictTypeLabel}
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Loan Details -->
                <tr>
                  <td style="padding:0 24px 16px 24px;">
                    <table width="100%" cellpadding="8" cellspacing="0" border="0" style="background-color:#f9fafb; border-radius:8px; border:1px solid #e5e7eb;">
                      <tr>
                        <td style="font-size:13px; color:#6b7280; font-weight:500; width:40%;">Loan Number:</td>
                        <td style="font-size:13px; color:#111827; font-weight:600;">${conflictData.loanNumber}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px; color:#6b7280; font-weight:500;">Beneficiary:</td>
                        <td style="font-size:13px; color:#111827;">${conflictData.beneficiaryName}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px; color:#6b7280; font-weight:500;">Bank:</td>
                        <td style="font-size:13px; color:#111827;">${conflictData.bankName}</td>
                      </tr>
                      <tr>
                        <td style="font-size:13px; color:#6b7280; font-weight:500;">Officer:</td>
                        <td style="font-size:13px; color:#111827;">${conflictData.officerName}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- AI vs Officer Decision -->
                <tr>
                  <td style="padding:0 24px 16px 24px;">
                    <div style="display:flex; gap:12px;">
                      <!-- AI Decision -->
                      <table width="48%" cellpadding="12" cellspacing="0" border="0" style="background-color:#eff6ff; border-radius:8px; border:1px solid #bfdbfe; display:inline-table;">
                        <tr>
                          <td style="text-align:center;">
                            <p style="margin:0 0 4px 0; font-size:11px; color:#1e40af; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">AI Decision</p>
                            <p style="margin:0 0 4px 0; font-size:16px; color:#1e3a8a; font-weight:700;">${conflictData.aiDecision}</p>
                            ${conflictData.aiRiskScore ? `<p style="margin:0; font-size:12px; color:#3b82f6;">Risk: ${conflictData.aiRiskScore}/100</p>` : ''}
                          </td>
                        </tr>
                      </table>

                      <!-- Officer Decision -->
                      <table width="48%" cellpadding="12" cellspacing="0" border="0" style="background-color:#f3e8ff; border-radius:8px; border:1px solid #d8b4fe; display:inline-table;">
                        <tr>
                          <td style="text-align:center;">
                            <p style="margin:0 0 4px 0; font-size:11px; color:#6b21a8; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Officer Decision</p>
                            <p style="margin:0 0 4px 0; font-size:16px; color:#581c87; font-weight:700;">${conflictData.officerDecision}</p>
                            <p style="margin:0; font-size:12px; color:#7c3aed;">${conflictData.officerName}</p>
                          </td>
                        </tr>
                      </table>
                    </div>
                  </td>
                </tr>

                <!-- Action Required -->
                <tr>
                  <td style="padding:0 24px 20px 24px;">
                    <div style="background-color:#fffbeb; border-left:4px solid #f59e0b; padding:12px 16px; border-radius:6px; margin-bottom:16px;">
                      <p style="margin:0; font-size:13px; color:#92400e; line-height:1.5;">
                        <strong>⚠️ Action Required:</strong> Please review this conflict and investigate the reason for the discrepancy between AI and human decisions.
                      </p>
                    </div>
                    
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center">
                          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/conflicts" 
                             style="display:inline-block; background:linear-gradient(135deg,#ea580c,#dc2626); color:#ffffff; text-decoration:none; padding:12px 32px; border-radius:8px; font-size:14px; font-weight:600; box-shadow:0 4px 12px rgba(234,88,12,0.3);">
                            View Conflict Details
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color:#f9fafb; padding:16px 24px; border-top:1px solid #e5e7eb;">
                    <p style="margin:0 0 8px 0; font-size:12px; color:#6b7280; line-height:1.5;">
                      This is an automated alert from the LoanSetu Conflict Monitoring System.
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
      from: `"LoanSetu Conflict Alert" <${process.env.EMAIL_USER_V2}>`,
      to: adminEmail,
      subject,
      html,
      text: `CONFLICT ALERT: ${conflictTypeLabel}\n\nLoan: ${conflictData.loanNumber}\nBeneficiary: ${conflictData.beneficiaryName}\nAI Decision: ${conflictData.aiDecision}\nOfficer Decision: ${conflictData.officerDecision}\n\nPlease review this conflict in the admin dashboard.`,
    });

    console.log(`✅ Conflict notification email sent successfully to ${adminEmail} for loan ${conflictData.loanNumber}`);
    return {
      message: "Conflict notification email sent successfully",
      success: true,
    };
  } catch (error: any) {
    console.error("❌ Error sending conflict notification email to", adminEmail, ":", error);
    return {
      message: "Failed to send conflict notification email",
      success: false,
      error: error.message,
    };
  }
};
