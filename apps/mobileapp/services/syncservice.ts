// apps/mobileapp/services/syncService.ts
import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system';
import { submissionService } from './submissionService';

export type NetworkQuality = 'excellent' | 'good' | 'poor' | 'offline';

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: string[];
}

const API_BASE_URL = 'https://your-api.com/api'; 
const API_HEALTH_ENDPOINT = `${API_BASE_URL}/health`;
const API_UPLOAD_ENDPOINT = `${API_BASE_URL}/upload`;
const API_SYNC_ENDPOINT = `${API_BASE_URL}/submissions/sync`;

export class SyncService {
  private isSyncing = false;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private readonly SYNC_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
  private readonly MAX_RETRY_COUNT = 5;

  /**
   * Check network connectivity and determine quality
   */
  async checkNetworkQuality(): Promise<NetworkQuality> {
    try {
      const networkState = await NetInfo.fetch();
      
      if (!networkState.isConnected || !networkState.isInternetReachable) {
        return 'offline';
      }

      const type = networkState.type;
      
      // Determine quality based on connection type
      if (type === 'wifi') {
        return 'excellent';
      } else if (type === 'cellular') {
        // For cellular, we assume good quality
        // In production, you might want to check signal strength
        return 'good';
      } else if (type === 'ethernet') {
        return 'excellent';
      }

      return 'good';
    } catch (error) {
      console.error('Network quality check error:', error);
      return 'offline';
    }
  }

  /**
   * Ping backend to verify it's reachable
   */
  async pingBackend(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(API_HEALTH_ENDPOINT, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error('Backend ping failed:', error);
      return false;
    }
  }

  /**
   * Upload a single file to storage and return URL
   */
  private async uploadFile(filePath: string): Promise<string> {
    try {
      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(filePath, {
        encoding: 'base64',
      });

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      const fileName = filePath.split('/').pop() || 'file';
      const mimeType = fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') 
        ? 'image/jpeg' 
        : 'image/png';

      // Upload to backend
      // TODO: Add your auth token here
      const response = await fetch(API_UPLOAD_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${yourAuthToken}`, // ADD AUTH TOKEN
        },
        body: JSON.stringify({
          fileName,
          mimeType,
          data: base64,
          size: fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      
      if (!result.url) {
        throw new Error('Upload response missing URL');
      }

      console.log(`File uploaded successfully: ${fileName}`);
      return result.url;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }

  /**
   * Sync a single submission to the backend
   */
  private async syncSubmission(submission: any): Promise<void> {
    console.log(`Starting sync for submission: ${submission.localUuid}`);

    try {
      // Upload all media files first
      const uploadedFiles = [];
      
      for (const mediaFile of submission.mediaFiles) {
        try {
          const url = await this.uploadFile(mediaFile.localPath);
          uploadedFiles.push({
            type: mediaFile.type,
            photoType: mediaFile.photoType,
            url,
            mimeType: mediaFile.mimeType,
            fileSize: mediaFile.fileSize,
            geoLat: mediaFile.geoLat,
            geoLng: mediaFile.geoLng,
            timestamp: mediaFile.timestamp,
          });
        } catch (uploadError) {
          console.error(`Failed to upload file: ${mediaFile.localPath}`, uploadError);
          throw new Error(`File upload failed: ${uploadError}`);
        }
      }

      console.log(`All files uploaded for ${submission.localUuid}, sending to server...`);

      // Send submission data to backend
      // TODO: Add your auth token here
      const response = await fetch(API_SYNC_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${yourAuthToken}`, // ADD AUTH TOKEN
        },
        body: JSON.stringify({
          localUuid: submission.localUuid,
          beneficiaryId: submission.beneficiaryId,
          loanId: submission.loanId,
          loanReferenceId: submission.loanReferenceId,
          loanSchemeName: submission.loanSchemeName,
          loanAmount: submission.loanAmount,
          productName: submission.productName,
          productDetails: submission.productDetails,
          geoLat: submission.geoLat,
          geoLng: submission.geoLng,
          submittedBy: submission.submittedBy,
          files: uploadedFiles,
          createdAt: submission.createdAt,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        // Distinguish between client errors (4xx) and server errors (5xx)
        if (response.status >= 400 && response.status < 500) {
          // Client error - mark as FAILED (permanent)
          console.error(`Validation error for ${submission.localUuid}: ${errorText}`);
          await submissionService.updateSyncStatus(submission.id, 'FAILED', {
            errorMessage: `Validation error: ${errorText}`,
          });
          throw new Error(`Validation error: ${errorText}`);
        } else {
          // Server error - keep as PENDING for retry
          console.error(`Server error for ${submission.localUuid}: ${errorText}`);
          throw new Error(`Server error: ${errorText}`);
        }
      }

      const result = await response.json();
      
      // Mark as synced with remote ID
      await submissionService.updateSyncStatus(submission.id, 'SYNCED', {
        remoteId: result.id || result.submissionId || result.data?.id,
      });

      console.log(`✅ Submission synced successfully: ${submission.localUuid}`);
    } catch (error) {
      console.error(`❌ Error syncing submission ${submission.localUuid}:`, error);
      
      // If not already marked as failed, check retry count
      if (submission.syncStatus !== 'FAILED') {
        if (submission.retryCount >= this.MAX_RETRY_COUNT) {
          await submissionService.updateSyncStatus(submission.id, 'FAILED', {
            errorMessage: `Max retries (${this.MAX_RETRY_COUNT}) exceeded: ${error}`,
          });
          console.error(`Max retries reached for ${submission.localUuid}`);
        } else {
          // Will remain PENDING and increment retry count
          console.log(`Retry count for ${submission.localUuid}: ${submission.retryCount + 1}`);
        }
      }
      
      throw error;
    }
  }

  /**
   * Main sync function - syncs all pending submissions
   */
  async sync(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('Sync already in progress, skipping...');
      return { 
        success: false, 
        syncedCount: 0, 
        failedCount: 0, 
        errors: ['Sync already in progress'] 
      };
    }

    this.isSyncing = true;
    const errors: string[] = [];
    let syncedCount = 0;
    let failedCount = 0;

    try {
      console.log('🔄 Starting sync process...');

      // Check network quality
      const quality = await this.checkNetworkQuality();
      console.log(`Network quality: ${quality}`);
      
      if (quality === 'offline') {
        console.log('❌ Device is offline, skipping sync');
        return { 
          success: false, 
          syncedCount: 0, 
          failedCount: 0, 
          errors: ['Device is offline'] 
        };
      }

      if (quality === 'poor') {
        console.log('⚠️ Network quality is poor, skipping sync');
        return { 
          success: false, 
          syncedCount: 0, 
          failedCount: 0, 
          errors: ['Network quality too poor for file upload'] 
        };
      }

      // Ping backend to ensure it's reachable
      const isReachable = await this.pingBackend();
      if (!isReachable) {
        console.log('❌ Backend is not reachable');
        return { 
          success: false, 
          syncedCount: 0, 
          failedCount: 0, 
          errors: ['Backend server not reachable'] 
        };
      }

      // Get pending submissions
      const pendingSubmissions = await submissionService.getPendingSubmissions();
      console.log(`📋 Found ${pendingSubmissions.length} pending submission(s)`);

      if (pendingSubmissions.length === 0) {
        console.log('✅ No pending submissions to sync');
        return { success: true, syncedCount: 0, failedCount: 0, errors: [] };
      }

      // Sync each submission
      for (const submission of pendingSubmissions) {
        try {
          await this.syncSubmission(submission);
          syncedCount++;
        } catch (error) {
          failedCount++;
          const errorMsg = `${submission.localUuid}: ${error}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      console.log(`✅ Sync completed: ${syncedCount} synced, ${failedCount} failed`);
      return { success: true, syncedCount, failedCount, errors };
    } catch (error) {
      console.error('❌ Sync process error:', error);
      errors.push(`General sync error: ${error}`);
      return { success: false, syncedCount, failedCount, errors };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Start periodic background sync
   */
  startPeriodicSync() {
    if (this.syncInterval) {
      console.log('⚠️ Periodic sync already running');
      return;
    }

    console.log('🔄 Starting periodic sync service');
    
    // Sync immediately
    this.sync().catch(err => console.error('Initial sync error:', err));

    // Then sync at regular intervals
    this.syncInterval = setInterval(() => {
      console.log('⏰ Periodic sync triggered');
      this.sync().catch(err => console.error('Periodic sync error:', err));
    }, this.SYNC_INTERVAL_MS);
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏹️ Stopped periodic sync service');
    }
  }

  /**
   * Check if sync is currently in progress
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  /**
   * Get sync interval in milliseconds
   */
  getSyncInterval(): number {
    return this.SYNC_INTERVAL_MS;
  }

  /**
   * Get max retry count
   */
  getMaxRetryCount(): number {
    return this.MAX_RETRY_COUNT;
  }

  /**
   * Manual trigger for testing
   */
  async forceSyncNow(): Promise<SyncResult> {
    console.log('🔧 Force sync triggered manually');
    return this.sync();
  }
}

export const syncService = new SyncService();