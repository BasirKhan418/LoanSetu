import { NextRequest, NextResponse } from 'next/server';
import { verifyLedgerChain } from '../../../../lib/ledger-service';
import prisma from '../../../../lib/prisma';
import { cookies } from 'next/headers';
import { verifyAdminToken } from '../../../../utils/verifyToken';
import Loans from '../../../../models/Loans';
import connectDb from '../../../../middleware/connectDb';

export async function GET(request: NextRequest) {
  try {

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required', success: false },
        { status: 401 }
      );
    }

    const validation = verifyAdminToken(token);
    if (!validation.success || validation.data?.type !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized access', success: false },
        { status: 403 }
      );
    }

    // Connect to MongoDB for loan details
    await connectDb();

    // Get all unique loan IDs from the ledger
    const ledgerLoans = await prisma.loanLedgerEntry.findMany({
      select: { 
        loanId: true,
        timestamp: true,
      },
      distinct: ['loanId'],
      orderBy: { timestamp: 'desc' }
    });

    const results = [];

    // Verify each loan and get details
    for (const ledgerLoan of ledgerLoans) {
      try {
        // Verify ledger integrity
        const verificationResult = await verifyLedgerChain(ledgerLoan.loanId);

        // Get loan details from MongoDB with populated beneficiary
        const loanDetails = await (Loans as any)
          .findById(ledgerLoan.loanId)
          .populate('beneficiaryId', 'name phone email')
          .lean();

        // Get ledger entry count and last activity
        const ledgerStats = await prisma.loanLedgerEntry.findMany({
          where: { loanId: ledgerLoan.loanId },
          orderBy: { timestamp: 'desc' },
          take: 1,
          select: {
            timestamp: true,
            eventType: true,
            performedBy: true,
          }
        });

        const entryCount = await prisma.loanLedgerEntry.count({
          where: { loanId: ledgerLoan.loanId }
        });

        // Determine borrower name - try multiple sources
        let borrowerName = 'Unknown';
        if (loanDetails) {
          if (loanDetails.applicantName) {
            borrowerName = loanDetails.applicantName;
          } else if (loanDetails.beneficiaryId?.name) {
            borrowerName = loanDetails.beneficiaryId.name;
          }
        }

        results.push({
          loanId: ledgerLoan.loanId,
          borrowerName,
          loanAmount: loanDetails?.sanctionAmount || 0,
          status: loanDetails?.status || 'Pending',
          verification: {
            isValid: verificationResult.isValid,
            totalEntries: verificationResult.totalEntries,
            invalidEntries: verificationResult.invalidEntries,
            brokenChain: verificationResult.brokenChain,
            errors: verificationResult.errors,
          },
          lastActivity: ledgerStats[0] ? {
            timestamp: ledgerStats[0].timestamp,
            eventType: ledgerStats[0].eventType,
            performedBy: ledgerStats[0].performedBy,
          } : null,
          entryCount,
          tamperedAt: verificationResult.isValid ? null : new Date(),
        });
      } catch (error) {
        console.error(`Error processing loan ${ledgerLoan.loanId}:`, error);
        console.error('Error details:', error instanceof Error ? error.message : error);
        results.push({
          loanId: ledgerLoan.loanId,
          borrowerName: 'Error Loading',
          loanAmount: 0,
          status: 'Error',
          error: 'Failed to verify',
          verification: {
            isValid: false,
            totalEntries: 0,
            invalidEntries: [],
            brokenChain: false,
            errors: ['Processing error'],
          },
          lastActivity: null,
          entryCount: 0,
          tamperedAt: null,
        });
      }
    }

    // Calculate summary stats
    const summary = {
      totalLoans: results.length,
      validLoans: results.filter(r => r.verification.isValid).length,
      tamperedLoans: results.filter(r => !r.verification.isValid).length,
      criticalAlerts: results.filter(r => !r.verification.isValid && r.verification.brokenChain).length,
    };

    return NextResponse.json({
      success: true,
      summary,
      loans: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in ledger monitor endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch ledger monitoring data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
