import nodemailer from 'nodemailer';
import Admin from '../models/Admin';
import connectDb from '../middleware/connectDb';

export interface TamperAlert {
  loanId: string;
  tenantId?: string;
  detectedAt: Date;
  invalidEntries: number[];
  errors: string[];
  totalEntries: number;
  detectedBy?: string;
}


export async function sendTamperAlert(alert: TamperAlert) {
  try {
    // Connect to MongoDB
    await connectDb();

    // Check if email is configured
    const emailHost = process.env.SMTP_HOST || process.env.EMAIL_HOST;
    const emailUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const emailPass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;
    const emailFrom = process.env.SMTP_FROM || process.env.EMAIL_FROM || emailUser;

    if (!emailHost || !emailUser || !emailPass) {
      console.error('❌ Email not configured. Set SMTP_HOST/EMAIL_HOST, SMTP_USER/EMAIL_USER, SMTP_PASS/EMAIL_PASSWORD in .env');
      return { success: false, error: 'Email not configured' };
    }

    // Fetch admin emails from database
    const query: any = {
      isActive: true,
      isVerified: true,
      $or: [
        { isSuperAdmin: true }, // All super admins
        ...(alert.tenantId ? [{ tenantId: alert.tenantId }] : []) // Tenant-specific admins
      ]
    };

    const admins = await Admin.find(query).select('email name isSuperAdmin').lean();

    if (!admins || admins.length === 0) {
      console.error('❌ No active admins found to send alerts to');
      return { success: false, error: 'No active admins found' };
    }

    const adminEmails = admins.map(admin => admin.email).filter(Boolean);
    
    if (adminEmails.length === 0) {
      console.error('❌ No valid admin email addresses found');
      return { success: false, error: 'No valid admin emails' };
    }

    console.log(`📧 Sending tamper alert email to ${adminEmails.length} admin(s):`, adminEmails);

    // Configure email transporter
    const transporter = nodemailer.createTransport({
      host: emailHost,
      port: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    // Email content
    const subject = `🚨 CRITICAL: Ledger Tampering Detected - Loan ${alert.loanId}`;
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #fff; padding: 20px; border: 2px solid #dc2626; border-radius: 0 0 8px 8px; }
    .alert-box { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
    .detail-row { padding: 8px 0; border-bottom: 1px solid #eee; }
    .detail-label { font-weight: bold; color: #666; }
    .error-list { background: #fef2f2; padding: 15px; margin: 10px 0; border-radius: 4px; }
    .error-item { color: #dc2626; margin: 5px 0; }
    .footer { text-align: center; color: #666; padding: 20px; font-size: 12px; }
    .action-btn { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 SECURITY ALERT</h1>
      <h2>Blockchain Ledger Tampering Detected</h2>
    </div>
    
    <div class="content">
      <div class="alert-box">
        <strong>⚠️ IMMEDIATE ACTION REQUIRED</strong>
        <p>Unauthorized modification detected in the immutable loan ledger system. This indicates potential fraud or data manipulation.</p>
      </div>

      <h3>Alert Details:</h3>
      <div class="detail-row">
        <span class="detail-label">Loan ID:</span> ${alert.loanId}
      </div>
      ${alert.tenantId ? `
      <div class="detail-row">
        <span class="detail-label">Tenant ID:</span> ${alert.tenantId}
      </div>
      ` : ''}
      <div class="detail-row">
        <span class="detail-label">Detected At:</span> ${alert.detectedAt.toLocaleString()}
      </div>
      <div class="detail-row">
        <span class="detail-label">Total Entries:</span> ${alert.totalEntries}
      </div>
      <div class="detail-row">
        <span class="detail-label">Compromised Entries:</span> ${alert.invalidEntries.length} (Entries #${alert.invalidEntries.join(', #')})
      </div>
      ${alert.detectedBy ? `
      <div class="detail-row">
        <span class="detail-label">Detected By:</span> ${alert.detectedBy}
      </div>
      ` : ''}

      <h3>Tampering Evidence:</h3>
      <div class="error-list">
        ${alert.errors.map(error => `<div class="error-item">❌ ${error}</div>`).join('')}
      </div>

      <h3>What This Means:</h3>
      <ul>
        <li><strong>Hash Validation Failed:</strong> The cryptographic hash of an entry doesn't match its content - data was modified</li>
        <li><strong>Chain Broken:</strong> The blockchain-like link between entries is severed - entries were deleted or reordered</li>
        <li><strong>Sequence Error:</strong> Entry numbers are out of order - possible injection or deletion</li>
      </ul>

      <h3>Immediate Actions Required:</h3>
      <ol>
        <li>🔒 Lock the affected loan for review</li>
        <li>🔍 Investigate who had database access</li>
        <li>📋 Review database audit logs</li>
        <li>🚨 Report to compliance team</li>
        <li>🔧 Restore from backup if necessary</li>
      </ol>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/bank/ledger?loanId=${alert.loanId}" class="action-btn">
          View Compromised Ledger
        </a>
      </div>

      <div class="alert-box">
        <strong>⚠️ Security Notice:</strong>
        <p>This email is automated and sent only when tampering is detected. The blockchain-like ledger system ensures all loan operations are immutable and any unauthorized changes are immediately flagged.</p>
      </div>
    </div>

    <div class="footer">
      <p>LoanSetu Security Alert System</p>
      <p>This is an automated security notification. Do not reply to this email.</p>
      <p>For support, contact: security@loansetu.com</p>
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `
🚨 CRITICAL SECURITY ALERT: Ledger Tampering Detected

Loan ID: ${alert.loanId}
${alert.tenantId ? `Tenant ID: ${alert.tenantId}\n` : ''}
Detected At: ${alert.detectedAt.toLocaleString()}
Total Entries: ${alert.totalEntries}
Compromised Entries: ${alert.invalidEntries.length} (Entries #${alert.invalidEntries.join(', #')})

TAMPERING EVIDENCE:
${alert.errors.map(error => `❌ ${error}`).join('\n')}

IMMEDIATE ACTIONS REQUIRED:
1. Lock the affected loan for review
2. Investigate who had database access
3. Review database audit logs
4. Report to compliance team
5. Restore from backup if necessary

View Details: ${process.env.NEXT_PUBLIC_APP_URL}/bank/ledger?loanId=${alert.loanId}

This is an automated security notification from LoanSetu's blockchain ledger system.
    `;

    // Send to all admins (super admins + tenant admins)
    console.log(`📤 Attempting to send ${adminEmails.length} email(s)...`);
    
    const emailResults = await Promise.allSettled(
      adminEmails.map(async (email) => {
        try {
          console.log(`  → Sending to: ${email}`);
          const result = await transporter.sendMail({
            from: `"LoanSetu Security Alert" <${emailFrom}>`,
            to: email,
            subject,
            text: textContent,
            html: htmlContent,
          });
          console.log(`  ✅ Sent successfully to: ${email}`, result.messageId);
          return { email, success: true, messageId: result.messageId };
        } catch (error) {
          console.error(`  ❌ Failed to send to: ${email}`, error instanceof Error ? error.message : error);
          return { email, success: false, error };
        }
      })
    );

    const successful = emailResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = emailResults.length - successful;

    console.log(`📊 Email results: ${successful} successful, ${failed} failed`);

    if (failed > 0) {
      console.warn('⚠️ Some emails failed to send:', 
        emailResults
          .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success))
          .map(r => r.status === 'fulfilled' ? r.value : r.reason)
      );
    }

    return { 
      success: successful > 0, 
      sentTo: adminEmails,
      successful,
      failed,
      details: emailResults
    };
  } catch (error) {
    console.error('❌ Failed to send tamper alert email:');
    console.error('Error details:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return { success: false, error };
  }
}


export async function logTamperDetection(alert: TamperAlert) {
  console.error('🚨 LEDGER TAMPERING DETECTED:', {
    loanId: alert.loanId,
    tenantId: alert.tenantId,
    detectedAt: alert.detectedAt,
    invalidEntries: alert.invalidEntries,
    errors: alert.errors,
  });

  // TODO: Add to security log table in database
  // This can be used for compliance reporting and forensic analysis
}
