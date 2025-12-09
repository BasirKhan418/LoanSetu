import { NextRequest, NextResponse } from 'next/server';
import { verifyLedgerChain } from '../../../../lib/ledger-service';
import { sendTamperAlert, logTamperDetection } from '../../../../lib/tamper-alert';
import prisma from '../../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Security: Check for cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔍 Starting scheduled ledger verification...');

    // Get all unique loan IDs from the ledger
    const loans = await prisma.loanLedgerEntry.findMany({
      select: { loanId: true },
      distinct: ['loanId'],
    });

    const results = {
      totalLoans: loans.length,
      validLoans: 0,
      tamperedLoans: 0,
      errors: [] as string[],
      tamperedLoanIds: [] as string[],
    };

    // Verify each loan's ledger
    for (const loan of loans) {
      try {
        const verificationResult = await verifyLedgerChain(loan.loanId);

        if (verificationResult.isValid) {
          results.validLoans++;
        } else {
          results.tamperedLoans++;
          results.tamperedLoanIds.push(loan.loanId);

          console.log(`🚨 TAMPERING DETECTED for loan ${loan.loanId}!`);

          const alert = {
            loanId: loan.loanId,
            detectedAt: new Date(),
            invalidEntries: verificationResult.invalidEntries,
            errors: verificationResult.errors,
            totalEntries: verificationResult.totalEntries,
            detectedBy: 'scheduled-cron-job',
          };

          // Log and send alerts
          await logTamperDetection(alert);
          const emailResult = await sendTamperAlert(alert);

          if (!emailResult.success) {
            results.errors.push(
              `Failed to send alert for loan ${loan.loanId}: ${emailResult.error}`
            );
          }
        }
      } catch (error) {
        console.error(`Error verifying loan ${loan.loanId}:`, error);
        results.errors.push(
          `Error verifying ${loan.loanId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    console.log('✅ Scheduled verification complete:', results);

    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in scheduled ledger verification:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to verify ledgers',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
