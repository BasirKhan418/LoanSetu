import { NextRequest, NextResponse } from 'next/server';
import { appendLedgerEntry } from '../../../../lib/ledger-service';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { loanId, eventType, eventData, amount, performedBy } = body;

    // Validation
    if (!loanId || typeof loanId !== 'string') {
      return NextResponse.json(
        { error: 'loanId is required and must be a string' },
        { status: 400 }
      );
    }

    if (!eventType || typeof eventType !== 'string') {
      return NextResponse.json(
        { error: 'eventType is required and must be a string' },
        { status: 400 }
      );
    }

    if (!eventData || typeof eventData !== 'object') {
      return NextResponse.json(
        { error: 'eventData is required and must be an object' },
        { status: 400 }
      );
    }

    if (!performedBy || typeof performedBy !== 'string') {
      return NextResponse.json(
        { error: 'performedBy is required and must be a string' },
        { status: 400 }
      );
    }

    // Get client IP address
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                      request.headers.get('x-real-ip') || 
                      'unknown';

    // Append the entry
    const result = await appendLedgerEntry({
      loanId,
      eventType,
      eventData,
      amount: amount != null ? Number(amount) : null,
      performedBy,
      ipAddress,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error in append ledger endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Failed to append ledger entry',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
