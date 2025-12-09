// apps/mobileapp/services/submissionService.ts
import { Directory, File, Paths } from 'expo-file-system';
import { database, MediaFile, Submission } from '../database/schema';

export interface CreateSubmissionData {
  beneficiaryId: number;
  loanId?: string;
  loanReferenceId?: string;
  loanSchemeName?: string;
  loanAmount?: string;
  productName: string;
  productDetails: string;
  geoLat: number;
  geoLng: number;
  submittedBy: 'beneficiary' | 'officer';
  photos: {
    type: 'front' | 'back' | 'left' | 'right';
    uri: string;
    latitude: number;
    longitude: number;
    timestamp: string;
  }[];
  invoicePhoto: {
    uri: string;
    latitude: number;
    longitude: number;
    timestamp: string;
  };
}

export class SubmissionService {
  /**
   * Generate UUID v4 for idempotency
   * This ensures that if the same submission is sent twice, the server can detect it
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Save file to permanent storage in app's document directory
   * Files are organized in a submissions/ folder
   */
  private async saveFile(uri: string, submissionUuid: string, fileType: string): Promise<string> {
    try {
      // derive extension from uri or fall back to jpg
      const fileExtension = (uri.split('.').pop() || 'jpg').split('?')[0];
      const fileName = `${submissionUuid}_${fileType}_${Date.now()}.${fileExtension}`;
      const submissionsDir = new Directory(Paths.document, 'submissions');
      
      // Ensure directory exists
      if (!submissionsDir.exists) {
        submissionsDir.create();
      }
      
      const newFile = new File(submissionsDir, fileName);
      
      // Copy file from temp location to permanent storage
      const sourceFile = new File(uri);
      await sourceFile.copy(newFile);
      
      console.log(`File saved: ${newFile.uri}`);
      return newFile.uri;
    } catch (error) {
      console.error('Error saving file:', error);
      throw error;
    }
  }
  /**
   * Get file size in bytes
   */
  private async getFileSize(uri: string): Promise<number> {
    try {
      const file = new File(uri);
      return file.exists ? file.size : 0;
    } catch (error) {
      console.error('Error getting file size:', error);
      return 0;
    }
  }

  /**
   * Create a new submission with all media files
   * This is the main function called when user submits verification
   * 
   * Returns: { submissionId, uuid }
   */
  async createSubmission(data: CreateSubmissionData): Promise<{ submissionId: number; uuid: string }> {
    const db = database.getDatabase();
    const localUuid = this.generateUUID();
    const now = new Date().toISOString();

    try {
      // Check if loan already has a pending submission
      if (data.loanId) {
        const { loanService } = await import('./loanService');
        const hasPending = await loanService.hasPendingSubmission(data.loanId);
        
        if (hasPending) {
          console.warn(`⚠️ Loan ${data.loanId} already has a pending submission. Skipping creation.`);
          throw new Error('A submission for this loan already exists and is pending sync. Please wait for it to complete.');
        }
      }

      // Start transaction for atomicity - all or nothing
      await db.execAsync('BEGIN TRANSACTION');

      // 1. Save or update loan if loan data is provided
      if (data.loanId) {
        try {
          // Parse product details to get loan info
          const productDetails = JSON.parse(data.productDetails);
          
          // Import loanService dynamically to avoid circular dependency
          const { loanService } = await import('./loanService');
          
          // Save or update the loan
          await loanService.saveOrUpdateLoan({
            loanId: data.loanId,
            beneficiaryId: productDetails.beneficiaryId || data.beneficiaryId,
            beneficiaryName: productDetails.beneficiaryName || 'Unknown',
            loanReferenceId: data.loanReferenceId || productDetails.loanReferenceId || '',
            schemeName: data.loanSchemeName || productDetails.schemeName || '',
            sanctionAmount: productDetails.sanctionAmount || parseFloat(data.loanAmount || '0'),
            sanctionDate: productDetails.sanctionDate || now,
            assetType: data.productName,
            tenantId: productDetails.tenantId,
          });
          
          console.log(`Loan saved/updated: ${data.loanId}`);
        } catch (loanError) {
          console.error('Error saving loan, continuing with submission:', loanError);
          // Don't fail the whole transaction if loan save fails
        }
      }

      // 2. Insert submission record with PENDING status
      const submissionResult = await db.runAsync(
        `INSERT INTO submissions (
          localUuid, beneficiaryId, loanId, loanReferenceId, loanSchemeName, loanAmount,
          productName, productDetails, geoLat, geoLng, submittedBy, 
          syncStatus, retryCount, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 0, ?)`,
        [
          localUuid,
          data.beneficiaryId,
          data.loanId || null,
          data.loanReferenceId || null,
          data.loanSchemeName || null,
          data.loanAmount || null,
          data.productName,
          data.productDetails,
          data.geoLat,
          data.geoLng,
          data.submittedBy,
          now
        ]
      );

      const submissionId = submissionResult.lastInsertRowId;

      // 3. Link submission to loan if loanId exists
      if (data.loanId) {
        try {
          const { loanService } = await import('./loanService');
          await loanService.linkSubmissionToLoan(data.loanId, submissionId);
        } catch (linkError) {
          console.error('Error linking submission to loan:', linkError);
          // Don't fail the transaction
        }
      }

      // 4. Save and insert product photos (4 angles)
      for (const photo of data.photos) {
        // Save file to permanent storage
        const savedPath = await this.saveFile(photo.uri, localUuid, photo.type);
        const fileSize = await this.getFileSize(savedPath);

        // Insert media file record
        await db.runAsync(
          `INSERT INTO media_files (
            submissionId, type, photoType, localPath, mimeType, fileSize,
            geoLat, geoLng, timestamp, metadata, createdAt
          ) VALUES (?, 'PHOTO', ?, ?, 'image/jpeg', ?, ?, ?, ?, ?, ?)`,

          [
            submissionId,
            photo.type,
            savedPath,
            fileSize,
            photo.latitude,
            photo.longitude,
            photo.timestamp,
            photo.metadata || null,
            now
          ]
        );
      }

      // 5. Save and insert invoice photo
      const invoicePath = await this.saveFile(data.invoicePhoto.uri, localUuid, 'invoice');
      const invoiceSize = await this.getFileSize(invoicePath);

      await db.runAsync(
        `INSERT INTO media_files (
          submissionId, type, photoType, localPath, mimeType, fileSize,
          geoLat, geoLng, timestamp, metadata, createdAt
        ) VALUES (?, 'INVOICE', NULL, ?, 'image/jpeg', ?, ?, ?, ?, ?, ?)`,

        [
          submissionId,
          invoicePath,
          invoiceSize,
          data.invoicePhoto.latitude,
          data.invoicePhoto.longitude,
          data.invoicePhoto.timestamp,
          data.invoicePhoto.metadata || null,
          now
        ]
      );

      // Commit transaction - make all changes permanent
      await db.execAsync('COMMIT');

      console.log(`✅ Submission created successfully: ${localUuid} (ID: ${submissionId})`);
      return { submissionId, uuid: localUuid };
    } catch (error) {
      // Rollback on error - undo all changes
      await db.execAsync('ROLLBACK');
      console.error('❌ Error creating submission:', error);
      throw error;
    }
  }

  /**
   * Get all submissions with PENDING sync status
   * Used by sync service to find submissions that need to be synced
   */
  async getPendingSubmissions(): Promise<(Submission & { mediaFiles: MediaFile[] })[]> {
    const db = database.getDatabase();

    try {
      const submissions = await db.getAllAsync<Submission>(
        'SELECT * FROM submissions WHERE syncStatus = ? ORDER BY createdAt ASC',
        ['PENDING']
      );

      const result = [];
      for (const submission of submissions) {
        const mediaFiles = await db.getAllAsync<MediaFile>(
          'SELECT * FROM media_files WHERE submissionId = ?',
          [submission.id]
        );
        result.push({ ...submission, mediaFiles });
      }

      return result;
    } catch (error) {
      console.error('Error getting pending submissions:', error);
      throw error;
    }
  }

  /**
   * Get all submissions regardless of status
   * Used for displaying submission history
   */
  async getAllSubmissions(): Promise<(Submission & { mediaFiles: MediaFile[] })[]> {
    const db = database.getDatabase();

    try {
      const submissions = await db.getAllAsync<Submission>(
        'SELECT * FROM submissions ORDER BY createdAt DESC'
      );

      const result = [];
      for (const submission of submissions) {
        const mediaFiles = await db.getAllAsync<MediaFile>(
          'SELECT * FROM media_files WHERE submissionId = ?',
          [submission.id]
        );
        result.push({ ...submission, mediaFiles });
      }

      return result;
    } catch (error) {
      console.error('Error getting all submissions:', error);
      throw error;
    }
  }

  /**
   * Get a single submission by ID
   */
  async getSubmissionById(id: number): Promise<(Submission & { mediaFiles: MediaFile[] }) | null> {
    const db = database.getDatabase();

    try {
      const submission = await db.getFirstAsync<Submission>(
        'SELECT * FROM submissions WHERE id = ?',
        [id]
      );

      if (!submission) return null;

      const mediaFiles = await db.getAllAsync<MediaFile>(
        'SELECT * FROM media_files WHERE submissionId = ?',
        [id]
      );

      return { ...submission, mediaFiles };
    } catch (error) {
      console.error('Error getting submission by ID:', error);
      throw error;
    }
  }

  /**
   * Get submission by UUID
   */
  async getSubmissionByUuid(uuid: string): Promise<(Submission & { mediaFiles: MediaFile[] }) | null> {
    const db = database.getDatabase();

    try {
      const submission = await db.getFirstAsync<Submission>(
        'SELECT * FROM submissions WHERE localUuid = ?',
        [uuid]
      );

      if (!submission) return null;

      const mediaFiles = await db.getAllAsync<MediaFile>(
        'SELECT * FROM media_files WHERE submissionId = ?',
        [submission.id]
      );

      return { ...submission, mediaFiles };
    } catch (error) {
      console.error('Error getting submission by UUID:', error);
      throw error;
    }
  }

  /**
   * Update submission sync status after sync attempt
   * Called by sync service after successful or failed sync
   */
  async updateSyncStatus(
    submissionId: number,
    status: 'SYNCED' | 'FAILED',
    options?: {
      remoteId?: string;
      errorMessage?: string;
    }
  ): Promise<void> {
    const db = database.getDatabase();
    const now = new Date().toISOString();

    try {
      if (status === 'SYNCED') {
        // Mark as synced with server ID
        await db.runAsync(
          `UPDATE submissions 
           SET syncStatus = ?, syncedAt = ?, remoteId = ?, errorMessage = NULL 
           WHERE id = ?`,
          [status, now, options?.remoteId || null, submissionId]
        );
        console.log(`✅ Submission ${submissionId} marked as SYNCED`);
      } else {
        // Mark as failed with error message and increment retry count
        await db.runAsync(
          `UPDATE submissions 
           SET syncStatus = ?, lastSyncAttemptAt = ?, errorMessage = ?, retryCount = retryCount + 1
           WHERE id = ?`,
          [status, now, options?.errorMessage || null, submissionId]
        );
        console.log(`❌ Submission ${submissionId} marked as FAILED`);
      }
    } catch (error) {
      console.error('Error updating sync status:', error);
      throw error;
    }
  }

  /**
   * Mark a submission as PENDING (for retry)
   * Used when user manually retries a failed submission
   */
  async markAsPending(submissionId: number): Promise<void> {
    const db = database.getDatabase();

    try {
      await db.runAsync(
        `UPDATE submissions 
         SET syncStatus = 'PENDING', lastSyncAttemptAt = ?, errorMessage = NULL
         WHERE id = ?`,
        [new Date().toISOString(), submissionId]
      );
      console.log(`🔄 Submission ${submissionId} marked as PENDING for retry`);
    } catch (error) {
      console.error('Error marking as pending:', error);
      throw error;
    }
  }

  /**
   * Delete synced submissions older than specified days
   * Useful for cleanup and storage management
   * 
   * Default: Delete submissions synced more than 90 days ago
   */
  async deleteSyncedSubmissions(daysOld: number = 90): Promise<number> {
    const db = database.getDatabase();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    try {
      // Get submissions to delete
      const submissions = await db.getAllAsync<{ id: number }>(
        `SELECT id FROM submissions 
         WHERE syncStatus = 'SYNCED' AND syncedAt < ?`,
        [cutoffDate.toISOString()]
      );

      // Delete physical media files for these submissions
      for (const sub of submissions) {
        const mediaFiles = await db.getAllAsync<MediaFile>(
          'SELECT * FROM media_files WHERE submissionId = ?',
          [sub.id]
        );

        for (const file of mediaFiles) {
          try {
            const fileObj = new File(file.localPath);
            if (fileObj.exists) {
              await fileObj.delete();
              console.log(`🗑️ Deleted file: ${file.localPath}`);
            }
          } catch (error) {
            console.error('Error deleting file:', error);
          }
        }
      }

      // Delete submission records (CASCADE will delete media_files records)
      const result = await db.runAsync(
        `DELETE FROM submissions 
         WHERE syncStatus = 'SYNCED' AND syncedAt < ?`,
        [cutoffDate.toISOString()]
      );

      console.log(`🗑️ Deleted ${result.changes} old synced submissions`);
      return result.changes;
    } catch (error) {
      console.error('Error deleting synced submissions:', error);
      throw error;
    }
  }

  /**
   * Get submission statistics
   * Returns counts for total, pending, synced, and failed submissions
   */
  async getStatistics(): Promise<{
    total: number;
    pending: number;
    synced: number;
    failed: number;
  }> {
    const db = database.getDatabase();

    try {
      const result = await db.getFirstAsync<{
        total: number;
        pending: number;
        synced: number;
        failed: number;
      }>(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN syncStatus = 'PENDING' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN syncStatus = 'SYNCED' THEN 1 ELSE 0 END) as synced,
          SUM(CASE WHEN syncStatus = 'FAILED' THEN 1 ELSE 0 END) as failed
        FROM submissions
      `);

      return result || { total: 0, pending: 0, synced: 0, failed: 0 };
    } catch (error) {
      console.error('Error getting statistics:', error);
      throw error;
    }
  }

  /**
   * Delete a submission and its media files
   * This is a complete deletion including physical files
   */
  async deleteSubmission(submissionId: number): Promise<void> {
    const db = database.getDatabase();

    try {
      // Get media files to delete physical files
      const mediaFiles = await db.getAllAsync<MediaFile>(
        'SELECT * FROM media_files WHERE submissionId = ?',
        [submissionId]
      );

      // Delete physical files
      for (const file of mediaFiles) {
        try {
          const fileObj = new File(file.localPath);
          if (fileObj.exists) {
            await fileObj.delete();
          }
        } catch (error) {
          console.error('Error deleting file:', error);
        }
      }

      // Delete submission (CASCADE will delete media_files records)
      await db.runAsync('DELETE FROM submissions WHERE id = ?', [submissionId]);
      console.log(`🗑️ Submission ${submissionId} deleted`);
    } catch (error) {
      console.error('Error deleting submission:', error);
      throw error;
    }
  }

  /**
   * Get all submissions for a specific beneficiary
   */
  async getSubmissionsByBeneficiary(beneficiaryId: number): Promise<(Submission & { mediaFiles: MediaFile[] })[]> {
    const db = database.getDatabase();

    try {
      const submissions = await db.getAllAsync<Submission>(
        'SELECT * FROM submissions WHERE beneficiaryId = ? ORDER BY createdAt DESC',
        [beneficiaryId]
      );

      const result = [];
      for (const submission of submissions) {
        const mediaFiles = await db.getAllAsync<MediaFile>(
          'SELECT * FROM media_files WHERE submissionId = ?',
          [submission.id]
        );
        result.push({ ...submission, mediaFiles });
      }

      return result;
    } catch (error) {
      console.error('Error getting submissions by beneficiary:', error);
      throw error;
    }
  }

  /**
   * Get failed submissions that can be retried
   */
  async getFailedSubmissions(): Promise<(Submission & { mediaFiles: MediaFile[] })[]> {
    const db = database.getDatabase();

    try {
      const submissions = await db.getAllAsync<Submission>(
        'SELECT * FROM submissions WHERE syncStatus = ? ORDER BY lastSyncAttemptAt DESC',
        ['FAILED']
      );

      const result = [];
      for (const submission of submissions) {
        const mediaFiles = await db.getAllAsync<MediaFile>(
          'SELECT * FROM media_files WHERE submissionId = ?',
          [submission.id]
        );
        result.push({ ...submission, mediaFiles });
      }

      return result;
    } catch (error) {
      console.error('Error getting failed submissions:', error);
      throw error;
    }
  }

  /**
   * Count media files for a submission
   */
  async countMediaFiles(submissionId: number): Promise<number> {
    const db = database.getDatabase();

    try {
      const result = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM media_files WHERE submissionId = ?',
        [submissionId]
      );
      return result?.count || 0;
    } catch (error) {
      console.error('Error counting media files:', error);
      throw error;
    }
  }

  /**
   * Get total storage used by submissions (in bytes)
   */
  async getTotalStorageUsed(): Promise<number> {
    const db = database.getDatabase();

    try {
      const result = await db.getFirstAsync<{ total: number }>(
        'SELECT SUM(fileSize) as total FROM media_files'
      );
      return result?.total || 0;
    } catch (error) {
      console.error('Error getting total storage:', error);
      throw error;
    }
  }

  /**
   * Delete all pending submissions
   * This will delete submissions with syncStatus = 'PENDING'
   */
  async deleteAllPendingSubmissions(): Promise<number> {
    const db = database.getDatabase();

    try {
      // Get all pending submissions
      const pendingSubmissions = await db.getAllAsync<Submission>(
        'SELECT * FROM submissions WHERE syncStatus = ?',
        ['PENDING']
      );

      let deletedCount = 0;

      for (const submission of pendingSubmissions) {
        // Get media files to delete physical files
        const mediaFiles = await db.getAllAsync<MediaFile>(
          'SELECT * FROM media_files WHERE submissionId = ?',
          [submission.id]
        );

        // Delete physical files
        for (const file of mediaFiles) {
          try {
            const fileObj = new File(file.localPath);
            if (fileObj.exists) {
              await fileObj.delete();
            }
          } catch (error) {
            console.error('Error deleting file:', error);
          }
        }

        // Delete submission (CASCADE will delete media_files records)
        await db.runAsync('DELETE FROM submissions WHERE id = ?', [submission.id]);
        deletedCount++;
      }

      console.log(`🗑️ Deleted ${deletedCount} pending submissions`);
      return deletedCount;
    } catch (error) {
      console.error('Error deleting pending submissions:', error);
      throw error;
    }
  }

  /**
   * Count pending submissions
   */
  async countPendingSubmissions(): Promise<number> {
    const db = database.getDatabase();

    try {
      // Only count submissions that have media files
      const result = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(DISTINCT s.id) as count 
         FROM submissions s 
         INNER JOIN media_files m ON s.id = m.submissionId 
         WHERE s.syncStatus = ?`,
        ['PENDING']
      );
      return result?.count || 0;
    } catch (error) {
      console.error('Error counting pending submissions:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const submissionService = new SubmissionService();