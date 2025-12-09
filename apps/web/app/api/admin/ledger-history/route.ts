import { NextRequest, NextResponse } from 'next/server';
import { getLedgerEntries } from '../../../../lib/ledger-service';
import { cookies } from 'next/headers';
import { verifyAdminToken } from '../../../../utils/verifyToken';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
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

    const searchParams = request.nextUrl.searchParams;
    const loanId = searchParams.get('loanId');

    if (!loanId) {
      return NextResponse.json(
        { error: 'loanId query parameter is required', success: false },
        { status: 400 }
      );
    }

    // Get all ledger entries for this loan
    const entries = await getLedgerEntries(loanId);

    return NextResponse.json({
      success: true,
      loanId,
      totalEntries: entries.length,
      entries,
    });
  } catch (error) {
    console.error('Error fetching ledger history:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch ledger history',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
