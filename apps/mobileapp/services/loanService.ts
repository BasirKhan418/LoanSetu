import { database, Loan } from '../database/schema';

class LoanService {
  async saveOrUpdateLoan(loanData: {
    loanId: string;
    beneficiaryId: string;
    beneficiaryName: string;
    loanReferenceId: string;
    schemeName: string;
    sanctionAmount: number;
    sanctionDate: string;
    assetType: string;
    tenantId?: string;
  }): Promise<number> {
    const db = database.getDatabase();
    const now = new Date().toISOString();

    try {
      // Check if loan already exists
      const existingLoan = await db.getFirstAsync<Loan>(
        'SELECT * FROM loans WHERE loanId = ?',
        [loanData.loanId]
      );

      if (existingLoan) {
        // Update existing loan
        await db.runAsync(
          `UPDATE loans SET 
            beneficiaryId = ?,
            beneficiaryName = ?,
            loanReferenceId = ?,
            schemeName = ?,
            sanctionAmount = ?,
            sanctionDate = ?,
            assetType = ?,
            tenantId = ?,
            updatedAt = ?
          WHERE loanId = ?`,
          [
            loanData.beneficiaryId,
            loanData.beneficiaryName,
            loanData.loanReferenceId,
            loanData.schemeName,
            loanData.sanctionAmount,
            loanData.sanctionDate,
            loanData.assetType,
            loanData.tenantId || null,
            now,
            loanData.loanId,
          ]
        );
        console.log(`Updated loan: ${loanData.loanId}`);
        return existingLoan.id;
      } else {
        // Insert new loan
        const result = await db.runAsync(
          `INSERT INTO loans (
            loanId, beneficiaryId, beneficiaryName, loanReferenceId,
            schemeName, sanctionAmount, sanctionDate, assetType,
            tenantId, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            loanData.loanId,
            loanData.beneficiaryId,
            loanData.beneficiaryName,
            loanData.loanReferenceId,
            loanData.schemeName,
            loanData.sanctionAmount,
            loanData.sanctionDate,
            loanData.assetType,
            loanData.tenantId || null,
            now,
            now,
          ]
        );
        console.log(`Created new loan: ${loanData.loanId}`);
        return result.lastInsertRowId;
      }
    } catch (error) {
      console.error('Error saving/updating loan:', error);
      throw error;
    }
  }

  /**
   * Link a submission to a loan
   * Ensures only one submission per loan by checking and preventing duplicates
   */
  async linkSubmissionToLoan(loanId: string, submissionId: number): Promise<void> {
    const db = database.getDatabase();
    const now = new Date().toISOString();

    try {
      // Check if loan already has a submission
      const loan = await db.getFirstAsync<Loan>(
        'SELECT submissionId FROM loans WHERE loanId = ?',
        [loanId]
      );

      if (loan && loan.submissionId && loan.submissionId !== submissionId) {
        // Delete the old submission if it exists
        await db.runAsync(
          'DELETE FROM submissions WHERE id = ?',
          [loan.submissionId]
        );
        console.log(`Deleted old submission ${loan.submissionId} for loan ${loanId}`);
      }

      // Update loan with new submission
      await db.runAsync(
        'UPDATE loans SET submissionId = ?, updatedAt = ? WHERE loanId = ?',
        [submissionId, now, loanId]
      );

      console.log(`Linked submission ${submissionId} to loan ${loanId}`);
    } catch (error) {
      console.error('Error linking submission to loan:', error);
      throw error;
    }
  }

  /**
   * Check if a loan already has a pending submission
   * Returns true if submission exists, false otherwise
   */
  async hasPendingSubmission(loanId: string): Promise<boolean> {
    const db = database.getDatabase();

    try {
      const result = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM submissions 
         WHERE loanId = ? AND syncStatus IN ('PENDING', 'SYNCING')`,
        [loanId]
      );
      return (result?.count || 0) > 0;
    } catch (error) {
      console.error('Error checking pending submission:', error);
      return false;
    }
  }

  /**
   * Get loan by loanId
   */
  async getLoanByLoanId(loanId: string): Promise<Loan | null> {
    const db = database.getDatabase();

    try {
      const loan = await db.getFirstAsync<Loan>(
        'SELECT * FROM loans WHERE loanId = ?',
        [loanId]
      );
      return loan || null;
    } catch (error) {
      console.error('Error getting loan:', error);
      throw error;
    }
  }

  /**
   * Get all loans
   */
  async getAllLoans(): Promise<Loan[]> {
    const db = database.getDatabase();

    try {
      const loans = await db.getAllAsync<Loan>(
        'SELECT * FROM loans ORDER BY createdAt DESC'
      );
      return loans;
    } catch (error) {
      console.error('Error getting all loans:', error);
      throw error;
    }
  }

  /**
   * Get loans by beneficiary
   */
  async getLoansByBeneficiary(beneficiaryId: string): Promise<Loan[]> {
    const db = database.getDatabase();

    try {
      const loans = await db.getAllAsync<Loan>(
        'SELECT * FROM loans WHERE beneficiaryId = ? ORDER BY createdAt DESC',
        [beneficiaryId]
      );
      return loans;
    } catch (error) {
      console.error('Error getting loans by beneficiary:', error);
      throw error;
    }
  }

  /**
   * Check if loan has a submission
   */
  async hasSubmission(loanId: string): Promise<boolean> {
    const db = database.getDatabase();

    try {
      const loan = await db.getFirstAsync<{ submissionId: number | null }>(
        'SELECT submissionId FROM loans WHERE loanId = ?',
        [loanId]
      );
      return !!(loan && loan.submissionId);
    } catch (error) {
      console.error('Error checking loan submission:', error);
      throw error;
    }
  }

  /**
   * Delete loan
   */
  async deleteLoan(loanId: string): Promise<void> {
    const db = database.getDatabase();

    try {
      await db.runAsync('DELETE FROM loans WHERE loanId = ?', [loanId]);
      console.log(`Deleted loan: ${loanId}`);
    } catch (error) {
      console.error('Error deleting loan:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const loanService = new LoanService();
