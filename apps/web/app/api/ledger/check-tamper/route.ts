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

    // Get user info for tracking who detected the tamper
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    let detectedBy = 'system';
    
    if (token) {
      const validation = verifyAdminToken(token);
      if (validation.success) {
        detectedBy = validation.data?.email || validation.data?.ifsc || validation.data?.id || 'user';
      }
    }

    // Verify the chain
    const verificationResult = await verifyLedgerChain(loanId);

    // If tampering detected and notify is true, send alerts
    if (!verificationResult.isValid && notify) {
      const alert = {
        loanId,
        tenantId: tenantId || undefined,
        detectedAt: new Date(),
        invalidEntries: verificationResult.invalidEntries,
        errors: verificationResult.errors,
        totalEntries: verificationResult.totalEntries,
        detectedBy,
      };

      // Log the detection
      await logTamperDetection(alert);

      // Send email alerts
      const emailResult = await sendTamperAlert(alert);

      return NextResponse.json(
        {
          loanId,
          ...verificationResult,
          alert: {
            sent: emailResult.success,
            timestamp: alert.detectedAt,
            recipients: emailResult.success ? ['super_admin', 'tenant_admins'] : [],
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
    console.error('Error in check tamper endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check for tampering',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ledger/check-tamper
 * Batch check multiple loans for tampering
 * 
 * Body: { loanIds: string[], notify: boolean, tenantId?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { loanIds, notify = false, tenantId } = body;

    if (!Array.isArray(loanIds) || loanIds.length === 0) {
      return NextResponse.json(
        { error: 'loanIds array is required' },
        { status: 400 }
      );
    }

    const results = [];
    let tamperedCount = 0;

    for (const loanId of loanIds) {
      const verification = await verifyLedgerChain(loanId);
      
      if (!verification.isValid) {
        tamperedCount++;

        if (notify) {
          const alert = {
            loanId,
            tenantId,
            detectedAt: new Date(),
            invalidEntries: verification.invalidEntries,
            errors: verification.errors,
            totalEntries: verification.totalEntries,
            detectedBy: 'batch_check',
          };

          await logTamperDetection(alert);
          await sendTamperAlert(alert);
        }
      }

      results.push({
        loanId,
        isValid: verification.isValid,
        errorCount: verification.errors.length,
      });
    }

    return NextResponse.json(
      {
        total: loanIds.length,
        valid: loanIds.length - tamperedCount,
        tampered: tamperedCount,
        results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in batch tamper check:', error);
    return NextResponse.json(
      { 
        error: 'Failed to perform batch check',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
