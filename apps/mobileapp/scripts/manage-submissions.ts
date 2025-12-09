// Script to view and delete submissions from SQLite
// Run this in a React Native component or debug console

import { database } from '../database/schema';

export const SubmissionManager = {
  /**
   * View all submissions
   */
  async viewAllSubmissions() {
    const db = database.getDatabase();
    if (!db) {
      console.error('Database not initialized');
      return;
    }

    try {
      const submissions = await db.getAllAsync<any>(
        `SELECT 
          id, localUuid, beneficiaryId, beneficiaryName,
          loanId, loanReferenceId, productName, 
          syncStatus, retryCount, createdAt, updatedAt
        FROM submissions 
        ORDER BY createdAt DESC`
      );

      console.log('=== ALL SUBMISSIONS ===');
      console.log(`Total: ${submissions.length}`);
      submissions.forEach((sub, index) => {
        console.log(`\n[${index + 1}] ID: ${sub.id} | UUID: ${sub.localUuid}`);
        console.log(`    Loan: ${sub.loanReferenceId || 'N/A'}`);
        console.log(`    Beneficiary: ${sub.beneficiaryName || sub.beneficiaryId}`);
        console.log(`    Product: ${sub.productName}`);
        console.log(`    Status: ${sub.syncStatus} (Retries: ${sub.retryCount})`);
        console.log(`    Created: ${sub.createdAt}`);
      });

      return submissions;
    } catch (error) {
      console.error('Error viewing submissions:', error);
    }
  },

  /**
   * View media files for a specific submission
   */
  async viewSubmissionMedia(submissionId: number) {
    const db = database.getDatabase();
    if (!db) {
      console.error('Database not initialized');
      return;
    }

    try {
      const mediaFiles = await db.getAllAsync<any>(
        `SELECT id, type, photoType, localPath, fileSize, timestamp
         FROM media_files 
         WHERE submissionId = ?
         ORDER BY timestamp ASC`,
        [submissionId]
      );

      console.log(`\n=== MEDIA FOR SUBMISSION ${submissionId} ===`);
      console.log(`Total files: ${mediaFiles.length}`);
      mediaFiles.forEach((media, index) => {
        console.log(`\n[${index + 1}] ${media.type} - ${media.photoType || 'N/A'}`);
        console.log(`    Size: ${(media.fileSize / 1024).toFixed(2)} KB`);
        console.log(`    Path: ${media.localPath}`);
      });

      return mediaFiles;
    } catch (error) {
      console.error('Error viewing media:', error);
    }
  },

  /**
   * Delete a specific submission by UUID
   */
  async deleteSubmission(uuid: string) {
    const db = database.getDatabase();
    if (!db) {
      console.error('Database not initialized');
      return;
    }

    try {
      await db.execAsync('BEGIN TRANSACTION');

      // Get submission ID first
      const submission = await db.getFirstAsync<{ id: number }>(
        'SELECT id FROM submissions WHERE localUuid = ?',
        [uuid]
      );

      if (!submission) {
        console.log(`Submission ${uuid} not found`);
        await db.execAsync('ROLLBACK');
        return;
      }

      // Delete media files (CASCADE should handle this, but being explicit)
      await db.runAsync('DELETE FROM media_files WHERE submissionId = ?', [submission.id]);
      
      // Delete submission
      await db.runAsync('DELETE FROM submissions WHERE id = ?', [submission.id]);

      await db.execAsync('COMMIT');
      console.log(`✅ Deleted submission: ${uuid}`);
    } catch (error) {
      await db.execAsync('ROLLBACK');
      console.error('Error deleting submission:', error);
    }
  },

  /**
   * Delete ALL submissions (use with caution!)
   */
  async deleteAllSubmissions() {
    const db = database.getDatabase();
    if (!db) {
      console.error('Database not initialized');
      return;
    }

    try {
      await db.execAsync('BEGIN TRANSACTION');
      
      // Delete all media files
      await db.runAsync('DELETE FROM media_files');
      
      // Delete all submissions
      await db.runAsync('DELETE FROM submissions');

      await db.execAsync('COMMIT');
      console.log('✅ Deleted ALL submissions');
    } catch (error) {
      await db.execAsync('ROLLBACK');
      console.error('Error deleting all submissions:', error);
    }
  },

  /**
   * Delete only PENDING submissions (not synced)
   */
  async deletePendingSubmissions() {
    const db = database.getDatabase();
    if (!db) {
      console.error('Database not initialized');
      return;
    }

    try {
      await db.execAsync('BEGIN TRANSACTION');

      // Get IDs of pending submissions
      const pending = await db.getAllAsync<{ id: number }>(
        "SELECT id FROM submissions WHERE syncStatus = 'PENDING'"
      );

      if (pending.length === 0) {
        console.log('No pending submissions to delete');
        await db.execAsync('ROLLBACK');
        return;
      }

      // Delete media files for these submissions
      for (const sub of pending) {
        await db.runAsync('DELETE FROM media_files WHERE submissionId = ?', [sub.id]);
      }

      // Delete pending submissions
      await db.runAsync("DELETE FROM submissions WHERE syncStatus = 'PENDING'");

      await db.execAsync('COMMIT');
      console.log(`✅ Deleted ${pending.length} pending submissions`);
    } catch (error) {
      await db.execAsync('ROLLBACK');
      console.error('Error deleting pending submissions:', error);
    }
  },

  /**
   * Reset retry count for failed submissions
   */
  async resetRetryCount() {
    const db = database.getDatabase();
    if (!db) {
      console.error('Database not initialized');
      return;
    }

    try {
      await db.runAsync(
        "UPDATE submissions SET retryCount = 0, syncStatus = 'PENDING' WHERE syncStatus = 'FAILED'"
      );
      console.log('✅ Reset retry count for failed submissions');
    } catch (error) {
      console.error('Error resetting retry count:', error);
    }
  },
};

// Usage in your React Native component:
// 
// import { SubmissionManager } from './scripts/manage-submissions';
//
// // View all
// await SubmissionManager.viewAllSubmissions();
//
// // View specific submission media
// await SubmissionManager.viewSubmissionMedia(1);
//
// // Delete specific submission
// await SubmissionManager.deleteSubmission('uuid-here');
//
// // Delete all pending
// await SubmissionManager.deletePendingSubmissions();
//
// // Delete ALL (careful!)
// await SubmissionManager.deleteAllSubmissions();
