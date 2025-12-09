import ConnectEmailClient from "../middleware/connectEmailClient";
import Admin from "../models/Admin";
export async function sendConflictAlertEmail({ tenantId, submissionId, reason }:{ tenantId: string; submissionId: string; reason: string }) {
  try {
    // Find all admins who are either superadmins OR belong to this specific tenant
    const findAllAdmins = await Admin.find({
      $or: [
        { isSuperAdmin: true },
        { tenantId: tenantId }
      ]
    } as any);

    if (!findAllAdmins || findAllAdmins.length === 0) {
      console.log("No admins found to send conflict alert email");
      return;
    }

    const transporter = await ConnectEmailClient();

    if (!transporter) {
      console.log("Failed to initialize email client");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .alert-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .info-row { margin: 15px 0; padding: 10px; background: #f9fafb; border-radius: 4px; }
          .info-label { font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase; }
          .info-value { color: #111827; font-size: 14px; margin-top: 5px; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; padding: 20px; }
          .warning-icon { font-size: 48px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="warning-icon">⚠️</div>
            <h1>Conflict of Interest Alert</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Immediate Review Required</p>
          </div>
          
          <div class="content">
            <div class="alert-box">
              <strong>🚨 High Priority Alert</strong>
              <p style="margin: 10px 0 0 0;">A potential conflict of interest has been detected in a submission review by our AI monitoring system.</p>
            </div>

            <div class="info-row">
              <div class="info-label">Submission ID</div>
              <div class="info-value">${submissionId}</div>
            </div>

            <div class="info-row">
              <div class="info-label">Detection Reason</div>
              <div class="info-value">${reason}</div>
            </div>

            <div class="info-row">
              <div class="info-label">Detection Time</div>
              <div class="info-value">${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</div>
            </div>

            <p style="margin-top: 25px;"><strong>Action Required:</strong></p>
            <ul>
              <li>Review the submission and officer remarks immediately</li>
              <li>Investigate the flagged conflict of interest</li>
              <li>Take appropriate action as per your organization's policy</li>
              <li>Document your findings in the admin dashboard</li>
            </ul>

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://loansetu.com'}/admin/dashboard" class="button">Review in Dashboard →</a>
            </div>

            <div style="margin-top: 30px; padding: 15px; background: #fffbeb; border-radius: 4px; border-left: 4px solid #f59e0b;">
              <strong>⏱️ Response Time Critical</strong>
              <p style="margin: 8px 0 0 0; font-size: 13px;">This alert requires immediate attention. Delayed response may impact compliance and operational integrity.</p>
            </div>
          </div>
          
          <div class="footer">
            <p>This is an automated alert from the LoanSetu Conflict Monitoring System.</p>
            <p>If you have questions, please contact your system administrator.</p>
            <p style="margin-top: 15px; color: #9ca3af;">© ${new Date().getFullYear()} LoanSetu. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email to all matching admins
    const emailPromises = findAllAdmins.map(admin => 
      transporter.sendMail({
        to: admin.email,
        subject: "Conflict of Interest Alert – Immediate Review Required",
        html,
      })
    );

    await Promise.all(emailPromises);
    console.log(`Conflict alert email sent to ${findAllAdmins.length} admin(s)`);

  } catch (err) {
    console.error("Email Send Error:", err);
  }
}

export async function sendConflictNotificationEmail({
  adminEmail,
  adminName,
  conflictData
}: {
  adminEmail: string;
  adminName: string;
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
}) {
  try {
    const transporter = await ConnectEmailClient();

    if (!transporter) {
      console.log("Failed to initialize email client");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .alert-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .comparison-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
          .decision-box { padding: 15px; border-radius: 6px; text-align: center; }
          .ai-decision { background: #dbeafe; border: 2px solid #3b82f6; }
          .officer-decision { background: #fed7aa; border: 2px solid #f97316; }
          .info-row { margin: 15px 0; padding: 10px; background: #f9fafb; border-radius: 4px; }
          .info-label { font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase; }
          .info-value { color: #111827; font-size: 14px; margin-top: 5px; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; padding: 20px; }
          .warning-icon { font-size: 48px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="warning-icon">⚠️</div>
            <h1>Decision Conflict Alert</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">AI & Officer Decision Mismatch</p>
          </div>
          
          <div class="content">
            <p>Dear ${adminName},</p>

            <div class="alert-box">
              <strong>🚨 Conflict Detected</strong>
              <p style="margin: 10px 0 0 0;">A decision conflict has been detected between AI recommendation and officer review for loan submission.</p>
            </div>

            <h3 style="color: #dc2626;">📋 Submission Details</h3>
            
            <div class="info-row">
              <div class="info-label">Loan Number</div>
              <div class="info-value">${conflictData.loanNumber}</div>
            </div>

            <div class="info-row">
              <div class="info-label">Beneficiary Name</div>
              <div class="info-value">${conflictData.beneficiaryName}</div>
            </div>

            <div class="info-row">
              <div class="info-label">Bank</div>
              <div class="info-value">${conflictData.bankName}</div>
            </div>

            <div class="info-row">
              <div class="info-label">Reviewing Officer</div>
              <div class="info-value">${conflictData.officerName}</div>
            </div>

            <h3 style="color: #dc2626; margin-top: 30px;">⚖️ Decision Comparison</h3>

            <div class="comparison-grid">
              <div class="decision-box ai-decision">
                <div style="font-size: 12px; font-weight: bold; color: #1e40af; margin-bottom: 10px;">🤖 AI DECISION</div>
                <div style="font-size: 18px; font-weight: bold; color: #1e3a8a;">${conflictData.aiDecision}</div>
                ${conflictData.aiRiskScore !== undefined ? `<div style="font-size: 12px; margin-top: 8px; color: #3b82f6;">Risk Score: ${conflictData.aiRiskScore}</div>` : ''}
              </div>
              
              <div class="decision-box officer-decision">
                <div style="font-size: 12px; font-weight: bold; color: #c2410c; margin-bottom: 10px;">👤 OFFICER DECISION</div>
                <div style="font-size: 18px; font-weight: bold; color: #7c2d12;">${conflictData.officerDecision}</div>
              </div>
            </div>

            <div class="info-row" style="background: #fef3c7; border-left: 4px solid #f59e0b;">
              <div class="info-label">Conflict Type</div>
              <div class="info-value" style="color: #92400e;">${conflictData.conflictType.replace(/_/g, ' ')}</div>
            </div>

            <p style="margin-top: 25px;"><strong>⏱️ Immediate Action Required:</strong></p>
            <ul>
              <li>Review both AI and officer assessments</li>
              <li>Verify the officer's reasoning and decision</li>
              <li>Check for any potential conflicts of interest</li>
              <li>Take appropriate corrective action if needed</li>
            </ul>

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://loansetu.com'}/admin/conflicts" class="button">Review Conflict →</a>
            </div>

            <div style="margin-top: 30px; padding: 15px; background: #fffbeb; border-radius: 4px; border-left: 4px solid #f59e0b;">
              <strong>📝 Note:</strong>
              <p style="margin: 8px 0 0 0; font-size: 13px;">This alert is generated automatically when officer decisions significantly deviate from AI recommendations. Please investigate promptly to maintain system integrity.</p>
            </div>
          </div>
          
          <div class="footer">
            <p>This is an automated alert from the LoanSetu Conflict Detection System.</p>
            <p>Detected at: ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>
            <p style="margin-top: 15px; color: #9ca3af;">© ${new Date().getFullYear()} LoanSetu. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      to: adminEmail,
      subject: `⚠️ Decision Conflict Alert - ${conflictData.loanNumber}`,
      html,
    });

    console.log(`Conflict notification email sent to ${adminEmail}`);

  } catch (err) {
    console.error("Email Send Error:", err);
    throw err; // Throw to allow caller to handle
  }
}
