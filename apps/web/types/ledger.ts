export type LoanEventType =
  | 'LOAN_CREATED'
  | 'LOAN_APPROVED'
  | 'LOAN_REJECTED'
  | 'LOAN_DISBURSED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_MISSED'
  | 'PAYMENT_LATE'
  | 'LOAN_CLOSED'
  | 'LOAN_DEFAULTED'
  | 'COLLATERAL_ADDED'
  | 'COLLATERAL_REMOVED'
  | 'STATUS_CHANGED'
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_VERIFIED'
  | 'CREDIT_CHECK_COMPLETED'
  | 'INTEREST_RATE_CHANGED'
  | 'TENURE_MODIFIED'
  | 'RESTRUCTURED'
  | 'WRITE_OFF'
  | 'RECOVERED';

export interface LedgerEntry {
  loanId: string;
  eventType: LoanEventType;
  eventData: Record<string, any>;
  amount?: number | null;
  performedBy: string;
  ipAddress?: string | null;
}

export interface LedgerEntryResponse {
  id: string;
  loanId: string;
  sequenceNum: number;
  eventType: string;
  eventData: Record<string, any>;
  amount?: number | null;
  performedBy: string;
  timestamp: Date;
  currentHash: string;
  previousHash: string;
  ipAddress?: string | null;
}

export interface AppendLedgerResult {
  success: boolean;
  entry: LedgerEntryResponse;
}

export interface VerificationResult {
  isValid: boolean;
  totalEntries: number;
  invalidEntries: number[];
  brokenChain: boolean;
  errors: string[];
}

export interface LedgerReadResponse {
  loanId: string;
  totalEntries: number;
  entries: LedgerEntryResponse[];
}

export interface LedgerVerifyResponse {
  loanId: string;
  isValid: boolean;
  totalEntries: number;
  invalidEntries: number[];
  brokenChain: boolean;
  errors: string[];
}

// Event Data Type Definitions

export interface LoanCreatedEvent {
  borrowerName: string;
  borrowerId?: string;
  loanType: string;
  requestedAmount: number;
  tenure: number;
  interestRate: number;
  purpose?: string;
  status: string;
}

export interface LoanApprovedEvent {
  approvedBy: string;
  officerId?: string;
  creditScore?: number;
  approvalNotes?: string;
  previousStatus: string;
  newStatus: string;
  conditions?: string[];
}

export interface LoanDisbursedEvent {
  disbursementMethod: string;
  bankAccount?: string;
  transactionId: string;
  disbursementDate: string;
  previousStatus: string;
  newStatus: string;
}

export interface PaymentReceivedEvent {
  emiNumber: number;
  paymentDate: string;
  paymentMethod: string;
  transactionId: string;
  principalAmount?: number;
  interestAmount?: number;
  remainingBalance?: number;
  nextDueDate?: string;
}

export interface PaymentMissedEvent {
  emiNumber: number;
  dueDate: string;
  missedDate: string;
  penaltyAmount?: number;
  daysMissed: number;
  remindersSent?: number;
}

export interface LoanClosedEvent {
  closureDate: string;
  closureType: 'Full Repayment' | 'Prepayment' | 'Foreclosure';
  totalPaid: number;
  finalSettlement: boolean;
  noc?: string;
  previousStatus: string;
  newStatus: string;
}
