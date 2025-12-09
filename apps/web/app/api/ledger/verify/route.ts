import { NextRequest, NextResponse } from 'next/server';
import { verifyLedgerChain } from '../../../../lib/ledger-service';
import { sendTamperAlert, logTamperDetection } from '../../../../lib/tamper-alert';
import { cookies } from 'next/headers';
import { verifyAdminToken } from '../../../../utils/verifyToken';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const loanId = searchParams.get('loanId');
    const notify = searchParams.get('notify') === 'true';
    const tenantId = searchParams.get('tenantId');

    // Validation
    if (!loanId) {
      return NextResponse.json(
        { error: 'loanId query parameter is required' },
        { status: 400 }
      );
    }

    // Get user info for tracking
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    let detectedBy = 'anonymous';
    
    if (token) {
      const validation = verifyAdminToken(token);
      if (validation.success) {
        detectedBy = validation.data?.email || validation.data?.ifsc || validation.data?.id || 'user';
      }
    }

    // Verify the chain
    const verificationResult = await verifyLedgerChain(loanId);

    // If tampering detected and notify requested, send alerts
    if (!verificationResult.isValid && notify) {
      console.log('🚨 TAMPERING DETECTED! Preparing to send alerts...');
      const alert = {
        loanId,
        tenantId: tenantId || undefined,
        detectedAt: new Date(),
        invalidEntries: verificationResult.invalidEntries,
        errors: verificationResult.errors,
        totalEntries: verificationResult.totalEntries,
        detectedBy,
      };

      console.log('Alert details:', JSON.stringify(alert, null, 2));

      // Log the detection
      await logTamperDetection(alert);

      // Send email alerts
      console.log('Calling sendTamperAlert...');
      const emailResult = await sendTamperAlert(alert);
      console.log('Email send result:', emailResult);

      return NextResponse.json(
        {
          loanId,
          ...verificationResult,
          tamperAlert: {
            sent: emailResult.success,
            timestamp: alert.detectedAt,
            detectedBy: alert.detectedBy,
            notificationsSent: emailResult.success ? ['SUPER_ADMIN'] : [],
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        loanId,
        ...verificationResult,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in verify ledger endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Failed to verify ledger chain',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
