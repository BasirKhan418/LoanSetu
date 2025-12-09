import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../api/config';
import { submissionService } from './submissionService';

export type NetworkQuality = 'excellent' | 'good' | 'poor' | 'offline';

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: string[];
}

const API_HEALTH_ENDPOINT = `${API_BASE_URL}/api/health`;
const API_SYNC_ENDPOINT = `${API_BASE_URL}/api/submission`;
const API_S3_UPLOAD_ENDPOINT = `${API_BASE_URL}/api/upload`;

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
      // Accept 404 as reachable - health endpoint might not exist
      return response.ok || response.status === 404;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Network error - backend truly unreachable
      return false;
    }
  }

  /**
   * Get auth token from AsyncStorage
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Upload file to S3 and return the file URL
   */
  private async uploadToS3(localPath: string, mimeType: string, token: string): Promise<string> {
    try {
      // Extract filename from path
      const filename = localPath.split('/').pop() || 'file';

      // Get signed upload URL from backend
      const urlResponse = await fetch(API_S3_UPLOAD_ENDPOINT, {
        method: 'POST',
        headers: {
          'token': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename,
          contentType: mimeType,
        }),
      });

      if (!urlResponse.ok) {
        throw new Error(`Failed to get upload URL: ${urlResponse.status}`);
      }

      const { data } = await urlResponse.json();
      const { uploadURL, fileURL } = data;

      // Use new File API - File can be used directly as fetch body
      const file = new FileSystem.File(localPath);

      // Upload to S3
      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        headers: {
          'Content-Type': mimeType,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error(`S3 upload failed: ${uploadResponse.status}`);
      }

      return fileURL;
    } catch (error) {
      console.error('Error uploading to S3:', error);
      throw error;
    }
  }

  /**
   * Sync a single submission to the backend
   */
  private async syncSubmission(submission: any): Promise<void> {
    console.log(`Starting sync for submission: ${submission.localUuid}`);

    try {
      // Get auth token
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Get device info
      const deviceModel = Device.modelName || Device.deviceName || 'Unknown Device';
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';
      const osVersion = Device.osVersion || 'Unknown';
      const appVersion = Constants.expoConfig?.version || '1.0.0';

      // Get network info
      const networkState = await NetInfo.fetch();
      const networkType = networkState.type === 'wifi' ? 'WiFi' : 
                         networkState.type === 'cellular' ? '4G' : 
                         networkState.type || 'Unknown';
      const isOffline = !networkState.isConnected;

      // Upload files to S3 and prepare media array
      console.log(`Uploading ${submission.mediaFiles.length} files to S3...`);
      const mediaArray = [];
      
      for (const mediaFile of submission.mediaFiles) {
        // Parse metadata if it exists (EXIF data)
        let parsedMetadata = null;
        try {
          parsedMetadata = mediaFile.metadata ? JSON.parse(mediaFile.metadata) : null;
        } catch (e) {
          console.warn('Failed to parse metadata:', e);
        }

        // Upload file to S3
        const fileKey = await this.uploadToS3(
          mediaFile.localPath,
          mediaFile.mimeType || 'image/jpeg',
          token
        );
        console.log(`✅ Uploaded ${mediaFile.type}: ${fileKey}`);

        // Map type to API format
        let apiType = 'IMAGE';
        if (mediaFile.type === 'VIDEO') {
          apiType = 'VIDEO';
        } else if (mediaFile.type === 'INVOICE') {
          apiType = 'DOCUMENT';
        }

        // Ensure timestamp is in ISO format
        let capturedAt = mediaFile.timestamp;
        if (capturedAt && !capturedAt.endsWith('Z') && !capturedAt.includes('+')) {
          // If timestamp doesn't have timezone info, assume UTC
          capturedAt = new Date(capturedAt).toISOString();
        }

        mediaArray.push({
          type: apiType,
          fileKey: fileKey,
          mimeType: mediaFile.mimeType || 'image/jpeg',
          sizeInBytes: mediaFile.fileSize || 0,
          capturedAt: capturedAt,
          gpsLat: Number(mediaFile.geoLat) || 0,
          gpsLng: Number(mediaFile.geoLng) || 0,
          hasExif: !!parsedMetadata,
          hasGpsExif: !!(mediaFile.geoLat && mediaFile.geoLng),
          isScreenshot: false,
          isPrintedPhotoSuspect: false,
        });
      }

      // Ensure submission timestamps are in ISO format
      let submittedAt = submission.createdAt;
      if (submittedAt && !submittedAt.endsWith('Z') && !submittedAt.includes('+')) {
        submittedAt = new Date(submittedAt).toISOString();
      }

      // Prepare submission data matching API expectations
      const submissionData: any = {
        loanId: submission.loanId,
        submissionType: 'INITIAL',
        status: 'PENDING_AI',
        media: mediaArray,
        deviceInfo: {
          platform: platform,
          osVersion: osVersion,
          appVersion: appVersion,
          deviceModel: deviceModel,
        },
        captureContext: {
          isOffline: isOffline,
          networkType: networkType,
          submittedAt: submittedAt,
          syncedAt: new Date().toISOString(),
        },
      };

      console.log(`Sending data for ${submission.localUuid} with ${submission.mediaFiles.length} files...`);
      console.log('Submission data:', JSON.stringify(submissionData, null, 2));

      // Send submission as JSON (API expects JSON body)
      const response = await fetch(API_SYNC_ENDPOINT, {
        method: 'POST',
        headers: {
          'token': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
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
      
      // Log submission details for debugging
      if (pendingSubmissions.length > 0) {
        console.log('Pending submissions details:');
        pendingSubmissions.forEach((sub, index) => {
          console.log(`Submission ${index + 1}:`, {
            id: sub.id,
            localUuid: sub.localUuid,
            loanId: sub.loanId,
            productName: sub.productName,
            syncStatus: sub.syncStatus,
            retryCount: sub.retryCount,
            mediaFilesCount: sub.mediaFiles?.length || 0,
            createdAt: sub.createdAt,
          });
        });
      }

      if (pendingSubmissions.length === 0) {
        console.log('✅ No pending submissions to sync');
        return { success: true, syncedCount: 0, failedCount: 0, errors: [] };
      }

      // Check if any submissions have media files
      const submissionsWithMedia = pendingSubmissions.filter(s => s.mediaFiles && s.mediaFiles.length > 0);
      if (submissionsWithMedia.length === 0) {
        console.log('✅ No submissions with media files to sync');
        return { success: true, syncedCount: 0, failedCount: 0, errors: [] };
      }

      console.log(`📤 Syncing ${submissionsWithMedia.length} submission(s) with media files...`);

      // Sync each submission
      for (const submission of submissionsWithMedia) {
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