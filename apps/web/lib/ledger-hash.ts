import crypto from 'crypto';

/**
 * Generates a SHA-256 hash from input data
 */
export function generateHash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Creates a hash for a ledger entry
 * Hash = SHA256(loanId + sequenceNum + previousHash + eventType + eventData + amount + performedBy + timestamp)
 */
export function createEntryHash(entry: {
  loanId: string;
  sequenceNum: number;
  previousHash: string;
  eventType: string;
  eventData: string;
  amount: string | null;
  performedBy: string;
  timestamp: Date;
}): string {
  const dataToHash = [
    entry.loanId,
    entry.sequenceNum.toString(),
    entry.previousHash,
    entry.eventType,
    entry.eventData,
    entry.amount || 'null',
    entry.performedBy,
    entry.timestamp.toISOString(),
  ].join('|');

  return generateHash(dataToHash);
}

/**
 * Verifies if a hash matches the expected value for an entry
 */
export function verifyEntryHash(entry: {
  loanId: string;
  sequenceNum: number;
  previousHash: string;
  eventType: string;
  eventData: string;
  amount: string | null;
  performedBy: string;
  timestamp: Date;
  currentHash: string;
}): boolean {
  const calculatedHash = createEntryHash(entry);
  return calculatedHash === entry.currentHash;
}

/**
 * Genesis hash constant for the first entry in a chain
 */
export const GENESIS_HASH = 'GENESIS';
