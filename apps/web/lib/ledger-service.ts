import { Decimal } from '@prisma/client/runtime/library';
import prisma from './prisma';
import { createEntryHash, verifyEntryHash, GENESIS_HASH } from './ledger-hash';
import { sendTamperAlert, logTamperDetection } from './tamper-alert';

export interface LedgerEntry {
  loanId: string;
  eventType: string;
  eventData: Record<string, any>;
  amount?: number | null;
  performedBy: string;
  ipAddress?: string | null;
}

export interface VerificationResult {
  isValid: boolean;
  totalEntries: number;
  invalidEntries: number[];
  brokenChain: boolean;
  errors: string[];
}

export async function appendLedgerEntry(entry: LedgerEntry) {
  try {
    // Get the last entry for this loan to chain from
    const lastEntry = await prisma.loanLedgerEntry.findFirst({
      where: { loanId: entry.loanId },
      orderBy: { sequenceNum: 'desc' },
    });

    // Determine sequence number and previous hash
    const sequenceNum = lastEntry ? lastEntry.sequenceNum + 1 : 0;
    const previousHash = lastEntry ? lastEntry.currentHash : GENESIS_HASH;

    // Prepare entry data
    const timestamp = new Date();
    const eventDataString = JSON.stringify(entry.eventData);
    const amountString = entry.amount != null ? entry.amount.toString() : null;

    // Create hash for this entry
    const currentHash = createEntryHash({
      loanId: entry.loanId,
      sequenceNum,
      previousHash,
      eventType: entry.eventType,
      eventData: eventDataString,
      amount: amountString,
      performedBy: entry.performedBy,
      timestamp,
    });

    // Insert the entry
    const newEntry = await prisma.loanLedgerEntry.create({
      data: {
        loanId: entry.loanId,
        sequenceNum,
        previousHash,
        currentHash,
        eventType: entry.eventType,
        eventData: eventDataString,
        amount: entry.amount != null ? new Decimal(entry.amount) : null,
        performedBy: entry.performedBy,
        timestamp,
        ipAddress: entry.ipAddress,
      },
    });

    // 🔒 AUTOMATIC TAMPERING DETECTION: Verify chain after append
    // This catches if someone modified previous entries
    const verificationResult = await verifyLedgerChain(entry.loanId);
    
    if (!verificationResult.isValid) {
      console.log('🚨 TAMPERING DETECTED after appending entry! Someone modified historical records.');
      
      const alert = {
        loanId: entry.loanId,
        detectedAt: new Date(),
        invalidEntries: verificationResult.invalidEntries,
        errors: verificationResult.errors,
        totalEntries: verificationResult.totalEntries,
        detectedBy: `system-auto-detection (triggered by ${entry.performedBy})`,
      };

      // Send alerts asynchronously (don't block the response)
      logTamperDetection(alert).catch(err => console.error('Failed to log tampering:', err));
      sendTamperAlert(alert).catch(err => console.error('Failed to send tamper alert:', err));
    }

    return {
      success: true,
      entry: {
        id: newEntry.id,
        loanId: newEntry.loanId,
        sequenceNum: newEntry.sequenceNum,
        eventType: newEntry.eventType,
        eventData: JSON.parse(newEntry.eventData),
        amount: newEntry.amount?.toNumber(),
        performedBy: newEntry.performedBy,
        timestamp: newEntry.timestamp,
        currentHash: newEntry.currentHash,
        previousHash: newEntry.previousHash,
      },
    };
  } catch (error) {
    console.error('Error appending ledger entry:', error);
    throw new Error(`Failed to append ledger entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getLedgerEntries(loanId: string) {
  try {
    const entries = await prisma.loanLedgerEntry.findMany({
      where: { loanId },
      orderBy: { sequenceNum: 'asc' },
    });

    return entries.map((entry) => ({
      id: entry.id,
      loanId: entry.loanId,
      sequenceNum: entry.sequenceNum,
      eventType: entry.eventType,
      eventData: JSON.parse(entry.eventData),
      amount: entry.amount?.toNumber() ?? null,
      performedBy: entry.performedBy,
      timestamp: entry.timestamp,
      currentHash: entry.currentHash,
      previousHash: entry.previousHash,
      ipAddress: entry.ipAddress,
    }));
  } catch (error) {
    console.error('Error retrieving ledger entries:', error);
    throw new Error(`Failed to retrieve ledger entries: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verifies the integrity of the entire chain for a loan
 * Checks:
 * 1. Hash validity for each entry
 * 2. Chain continuity (each entry's previousHash matches the previous entry's currentHash)
 * 3. Sequence number continuity
 */
export async function verifyLedgerChain(loanId: string): Promise<VerificationResult> {
  const result: VerificationResult = {
    isValid: true,
    totalEntries: 0,
    invalidEntries: [],
    brokenChain: false,
    errors: [],
  };

  try {
    const entries = await prisma.loanLedgerEntry.findMany({
      where: { loanId },
      orderBy: { sequenceNum: 'asc' },
    });

    result.totalEntries = entries.length;

    if (entries.length === 0) {
      return result; // Empty chain is valid
    }

    let previousEntry: typeof entries[0] | null = null;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (!entry) continue;

      // Check sequence number
      if (entry.sequenceNum !== i) {
        result.isValid = false;
        result.invalidEntries.push(i);
        result.errors.push(`Entry ${i}: Incorrect sequence number (expected ${i}, got ${entry.sequenceNum})`);
      }

      // Check hash validity
      const isHashValid = verifyEntryHash({
        loanId: entry.loanId,
        sequenceNum: entry.sequenceNum,
        previousHash: entry.previousHash,
        eventType: entry.eventType,
        eventData: entry.eventData,
        amount: entry.amount?.toString() || null,
        performedBy: entry.performedBy,
        timestamp: entry.timestamp,
        currentHash: entry.currentHash,
      });

      if (!isHashValid) {
        result.isValid = false;
        result.invalidEntries.push(i);
        result.errors.push(`Entry ${i}: Hash validation failed`);
      }

      // Check chain continuity
      if (i === 0) {
        // First entry should have GENESIS as previousHash
        if (entry.previousHash !== GENESIS_HASH) {
          result.isValid = false;
          result.brokenChain = true;
          result.invalidEntries.push(i);
          result.errors.push(`Entry ${i}: First entry should have GENESIS hash`);
        }
      } else if (previousEntry) {
        // Subsequent entries should chain to the previous entry
        if (entry.previousHash !== previousEntry.currentHash) {
          result.isValid = false;
          result.brokenChain = true;
          result.invalidEntries.push(i);
          result.errors.push(
            `Entry ${i}: Chain broken - previousHash doesn't match previous entry's currentHash`
          );
        }
      }

      previousEntry = entry;
    }

    return result;
  } catch (error) {
    console.error('Error verifying ledger chain:', error);
    throw new Error(`Failed to verify ledger chain: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gets the latest entry for a loan
 */
export async function getLatestEntry(loanId: string) {
  try {
    const entry = await prisma.loanLedgerEntry.findFirst({
      where: { loanId },
      orderBy: { sequenceNum: 'desc' },
    });

    if (!entry) return null;

    return {
      id: entry.id,
      loanId: entry.loanId,
      sequenceNum: entry.sequenceNum,
      eventType: entry.eventType,
      eventData: JSON.parse(entry.eventData),
      amount: entry.amount?.toNumber(),
      performedBy: entry.performedBy,
      timestamp: entry.timestamp,
      currentHash: entry.currentHash,
      previousHash: entry.previousHash,
    };
  } catch (error) {
    console.error('Error retrieving latest entry:', error);
    throw new Error(`Failed to retrieve latest entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
