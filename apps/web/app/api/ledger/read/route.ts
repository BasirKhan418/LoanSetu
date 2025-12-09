import { NextRequest, NextResponse } from 'next/server';
import { getLedgerEntries, getLatestEntry, verifyLedgerChain } from '../../../../lib/ledger-service';
import { sendTamperAlert, logTamperDetection } from '../../../../lib/tamper-alert';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const loanId = searchParams.get('loanId');
    const latest = searchParams.get('latest') === 'true';

    // Validation
    if (!loanId) {
      return NextResponse.json(
        { error: 'loanId query parameter is required' },
        { status: 400 }
      );
    }

    if (latest) {
      const entry = await getLatestEntry(loanId);
      
      if (!entry) {
        return NextResponse.json(
          { error: 'No entries found for this loan' },
          { status: 404 }
        );
      }

      return NextResponse.json({ entry }, { status: 200 });
    }

    const entries = await getLedgerEntries(loanId);

    // 🔒 AUTOMATIC TAMPERING DETECTION: Verify chain integrity on every read
    const verificationResult = await verifyLedgerChain(loanId);
    
    if (!verificationResult.isValid) {
      console.log('🚨 TAMPERING DETECTED during ledger read! Sending automatic alerts...');
      
      const alert = {
        loanId,
        tenantId: searchParams.get('tenantId') || undefined,
        detectedAt: new Date(),
        invalidEntries: verificationResult.invalidEntries,
        errors: verificationResult.errors,
        totalEntries: verificationResult.totalEntries,
        detectedBy: 'system-auto-detection',
      };

      // Log and send alerts asynchronously (don't block the response)
      logTamperDetection(alert).catch(err => console.error('Failed to log tampering:', err));
      sendTamperAlert(alert).catch(err => console.error('Failed to send tamper alert:', err));
    }

    return NextResponse.json(
      { 
        loanId,
        totalEntries: entries.length,
        entries,
        verification: {
          isValid: verificationResult.isValid,
          checkedAt: new Date().toISOString()
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in read ledger endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve ledger entries',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
