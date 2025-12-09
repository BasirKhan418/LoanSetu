// apps/mobileapp/services/verificationSyncService.ts
import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system';
import { database } from '../database/schema';

interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: string[];
}

export class VerificationSyncService {
  private apiBaseUrl: string;
  private token: string | null = null;
  private isSyncing = false;
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.apiBaseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://loansetu.devsomeware.com/';
  }

  /**
   * Set authentication token
   */
  setToken(token: string) {
    this.token = token;
  }

  /**
   * Check if device is online
   */
  async isOnline(): Promise<boolean> {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected === true && netInfo.isInternetReachable === true;
  }

  /**
   * Start automatic sync on interval
   */
  startAutoSync(intervalMs: number = 120000) { // 2 minutes default
    if (this.syncInterval) {
      return; // Already running
    }

    this.syncInterval = setInterval(async () => {
      const online = await this.isOnline();
      if (online) {
        await this.syncPendingSubmissions();
      }
    }, intervalMs);

    console.log('Auto-sync started');
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Auto-sync stopped');
    }
  }

  /**
   * Sync all pending submissions
   */
  async syncPendingSubmissions(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return { success: false, syncedCount: 0, failedCount: 0, errors: ['Sync already in progress'] };
    }

    if (!(await this.isOnline())) {
      return { success: false, syncedCount: 0, failedCount: 0, errors: ['Device is offline'] };
    }

    if (!this.token) {
      return { success: false, syncedCount: 0, failedCount: 0, errors: ['Not authenticated'] };
    }

    this.isSyncing = true;
    const errors: string[] = [];
    let syncedCount = 0;
    let failedCount = 0;

    try {
      const db = database.getDatabase();

      // Get all pending submissions
      const pendingSubmissions = await db.getAllAsync<any>(
        `SELECT * FROM submissions WHERE syncStatus = 'PENDING' ORDER BY createdAt ASC`
      );

      console.log(`Found ${pendingSubmissions.length} pending submissions`);

      for (const submission of pendingSubmissions) {
        try {
          await this.syncSubmission(submission);
          syncedCount++;
        } catch (error) {
          failedCount++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Submission ${submission.localUuid}: ${errorMessage}`);
          
          // Update retry count and error message
          await db.runAsync(
            `UPDATE submissions 
             SET retryCount = retryCount + 1, 
                 errorMessage = ?,
                 lastSyncAttemptAt = ?
             WHERE id = ?`,
            [errorMessage, new Date().toISOString(), submission.id]
          );

          // Mark as FAILED after max retries
          if (submission.retryCount >= 3) {
            await db.runAsync(
              'UPDATE submissions SET syncStatus = ? WHERE id = ?',
              ['FAILED', submission.id]
            );
          }
        }
      }

      return {
        success: failedCount === 0,
        syncedCount,
        failedCount,
        errors,
      };
    } catch (error) {
      console.error('Sync service error:', error);
      return {
        success: false,
        syncedCount,
        failedCount,
        errors: [...errors, error instanceof Error ? error.message : 'Unknown error'],
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync a single submission
   */
  private async syncSubmission(submission: any): Promise<void> {
    const db = database.getDatabase();

    // Get associated media files
    const mediaFiles = await db.getAllAsync<any>(
      'SELECT * FROM media_files WHERE submissionId = ?',
      [submission.id]
    );

    console.log(`Syncing submission ${submission.localUuid} with ${mediaFiles.length} media files`);

    // Upload media files first
    const uploadedMedia = [];
    for (const media of mediaFiles) {
      try {
        const uploadedUrl = await this.uploadMediaFile(media, submission.localUuid);
        uploadedMedia.push({
          type: media.type,
          photoType: media.photoType,
          url: uploadedUrl,
          mimeType: media.mimeType,
          fileSize: media.fileSize,
          gpsLat: media.geoLat,
          gpsLng: media.geoLng,
          timestamp: media.timestamp,
        });
      } catch (error) {
        console.error(`Failed to upload media ${media.id}:`, error);
        throw new Error(`Media upload failed: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    }

    // Prepare submission payload matching your backend API
    const submissionPayload = {
      localUuid: submission.localUuid,
      loanId: submission.loanId,
      productName: submission.productName,
      productDetails: submission.productDetails,
      geoLat: submission.geoLat,
      geoLng: submission.geoLng,
      submittedBy: submission.submittedBy,
      media: uploadedMedia,
      createdAt: submission.createdAt,
    };

    // Submit to backend using your existing /api/submission endpoint
    const response = await fetch(`${this.apiBaseUrl}/api/submission`, {
      method: 'POST',
      headers: {
        'token': this.token!, // Your API uses 'token' header instead of 'Authorization'
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submissionPayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || 'Submission failed');
    }

    const result = await response.json();
    
    // Check if submission was successful
    if (!result.success) {
      throw new Error(result.message || 'Submission failed');
    }

    // Update submission status with the ID from your backend response
    await db.runAsync(
      `UPDATE submissions 
       SET syncStatus = 'SYNCED', 
           remoteId = ?,
           syncedAt = ?
       WHERE id = ?`,
      [result.data?._id || result.data?.id, new Date().toISOString(), submission.id]
    );

    // Clean up local media files
    for (const media of mediaFiles) {
      try {
        await FileSystem.deleteAsync(media.localPath, { idempotent: true });
      } catch (error) {
        console.warn(`Failed to delete local file ${media.localPath}:`, error);
      }
    }

    console.log(`Successfully synced submission ${submission.localUuid}`);
  }

  /**
   * Upload a single media file to S3 using your existing upload endpoint
   */
  private async uploadMediaFile(media: any, submissionUuid: string): Promise<string> {
    // Generate unique filename
    const fileName = `${submissionUuid}_${media.type}_${Date.now()}.${this.getExtension(media.mimeType)}`;
    
    // Get presigned URL from your backend
    const presignedResponse = await fetch(`${this.apiBaseUrl}/api/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: fileName,
        contentType: media.mimeType,
      }),
    });

    if (!presignedResponse.ok) {
      throw new Error('Failed to get presigned URL');
    }

    const presignedData = await presignedResponse.json();
    
    if (!presignedData.success) {
      throw new Error(presignedData.message || 'Failed to get upload URL');
    }

    // Upload file to S3 using presigned URL
    const uploadResponse = await FileSystem.uploadAsync(
      presignedData.data.uploadURL, 
      media.localPath, 
      {
        httpMethod: 'PUT',
        headers: {
          'Content-Type': media.mimeType,
        },
      }
    );

    if (uploadResponse.status !== 200 && uploadResponse.status !== 204) {
      throw new Error(`S3 upload failed with status ${uploadResponse.status}`);
    }

    // Return the permanent file URL
    return presignedData.data.fileURL;
  }

  /**
   * Get file extension from MIME type
   */
  private getExtension(mimeType: string): string {
    const mimeMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'video/mp4': 'mp4',
      'video/quicktime': 'mov',
    };
    return mimeMap[mimeType] || 'bin';
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<{
    pending: number;
    synced: number;
    failed: number;
  }> {
    const db = database.getDatabase();

    const pending = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM submissions WHERE syncStatus = "PENDING"'
    );
    
    const synced = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM submissions WHERE syncStatus = "SYNCED"'
    );
    
    const failed = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM submissions WHERE syncStatus = "FAILED"'
    );

    return {
      pending: pending?.count || 0,
      synced: synced?.count || 0,
      failed: failed?.count || 0,
    };
  }

  /**
   * Get pending submissions count
   */
  async getPendingCount(): Promise<number> {
    const db = database.getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM submissions WHERE syncStatus = "PENDING"'
    );
    return result?.count || 0;
  }

  /**
   * Retry failed submissions
   */
  async retryFailedSubmissions(): Promise<SyncResult> {
    const db = database.getDatabase();
    
    // Reset FAILED submissions to PENDING with reset retry count
    await db.runAsync(
      `UPDATE submissions 
       SET syncStatus = 'PENDING', 
           retryCount = 0,
           errorMessage = NULL
       WHERE syncStatus = 'FAILED'`
    );

    return await this.syncPendingSubmissions();
  }
}

// Singleton instance
export const verificationSyncService = new VerificationSyncService();
