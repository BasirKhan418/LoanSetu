// apps/mobileapp/contexts/SubmissionContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import React, { createContext, useContext, useState } from 'react';
import uuid from 'react-native-uuid';
import { database } from '../database/schema';
import { LoanDetails, LocalMedia, Location, SubmissionState, SubmissionStatus } from '../types/submission';

interface SubmissionContextType {
  submissionState: SubmissionState;
  initializeSubmission: (loanDetails: LoanDetails) => Promise<void>;
  addMedia: (media: LocalMedia) => Promise<void>;
  removeMedia: (localId: string) => Promise<void>;
  updateLocation: (location: Location) => void;
  saveToSQLite: (status: SubmissionStatus) => Promise<void>;
  resetSubmission: () => void;
  isLoading: boolean;
}

const SubmissionContext = createContext<SubmissionContextType | undefined>(undefined);

export function useSubmission() {
  const context = useContext(SubmissionContext);
  if (context === undefined) {
    throw new Error('useSubmission must be used within a SubmissionProvider');
  }
  return context;
}

export function SubmissionProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    submissionId: null,
    loanDetails: null,
    media: [],
    currentLocation: null,
    status: 'DRAFT',
  });

  const initializeSubmission = async (loanDetails: LoanDetails) => {
    const submissionId = uuid.v4() as string;
    const now = new Date().toISOString();

    setSubmissionState({
      submissionId,
      loanDetails,
      media: [],
      currentLocation: null,
      status: 'LOCAL_DRAFT',
      createdAt: now,
      updatedAt: now,
    });

    // Create a draft submission in SQLite
    const db = database.getDatabase();
    if (db) {
      try {
        await db.runAsync(
          `INSERT INTO submissions (
            localUuid, 
            loanId, 
            loanReferenceId, 
            loanSchemeName,
            loanAmount,
            beneficiaryId,
            beneficiaryName,
            productName, 
            productDetails, 
            geoLat, 
            geoLng, 
            submittedBy, 
            syncStatus, 
            retryCount,
            createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            submissionId,
            loanDetails.loanId,
            loanDetails.loanReferenceId,
            loanDetails.schemeName,
            loanDetails.sanctionAmount.toString(),
            loanDetails.beneficiaryId,
            loanDetails.beneficiaryName,
            loanDetails.assetType,
            JSON.stringify(loanDetails),
            loanDetails.expectedLocation?.latitude || 0,
            loanDetails.expectedLocation?.longitude || 0,
            'officer',
            'PENDING',
            0,
            now,
          ]
        );
        console.log('Draft submission created in SQLite');
      } catch (error) {
        console.error('Error creating draft submission:', error);
      }
    }
  };

  const addMedia = async (media: LocalMedia) => {
    const mediaWithId = {
      ...media,
      localId: media.localId || (uuid.v4() as string),
    };

    setSubmissionState((prev) => ({
      ...prev,
      media: [...prev.media, mediaWithId],
      updatedAt: new Date().toISOString(),
    }));

    // Save media to SQLite
    const db = database.getDatabase();
    if (db && submissionState.submissionId) {
      try {
        const submissionResult = await db.getFirstAsync<{ id: number }>(
          'SELECT id FROM submissions WHERE localUuid = ?',
          [submissionState.submissionId]
        );

        if (submissionResult) {
          const typeMap: Record<string, string> = {
            'IMAGE': 'PHOTO',
            'VIDEO': 'VIDEO',
            'DOCUMENT': 'INVOICE',
          };

          await db.runAsync(
            `INSERT INTO media_files (
              submissionId, 
              type, 
              photoType, 
              localPath, 
              mimeType, 
              fileSize, 
              geoLat, 
              geoLng, 
              timestamp, 
              createdAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              submissionResult.id,
              typeMap[media.type] || 'PHOTO',
              media.photoType || null,
              media.localPath,
              media.mimeType,
              media.sizeInBytes,
              media.gpsLat || 0,
              media.gpsLng || 0,
              media.capturedAt,
              new Date().toISOString(),
            ]
          );
          console.log('Media saved to SQLite');
        }
      } catch (error) {
        console.error('Error saving media to SQLite:', error);
      }
    }
  };

  const removeMedia = async (localId: string) => {
    // Find media before removing from state
    const media = submissionState.media.find((m) => m.localId === localId);
    
    setSubmissionState((prev) => ({
      ...prev,
      media: prev.media.filter((m) => m.localId !== localId),
      updatedAt: new Date().toISOString(),
    }));

    // Remove from SQLite if exists
    const db = database.getDatabase();
    if (db && media) {
      try {
        // Delete by localPath since newly captured media might not have id yet
        await db.runAsync(
          'DELETE FROM media_files WHERE localPath = ?',
          [media.localPath]
        );
        console.log('Media removed from SQLite:', media.localPath);
      } catch (error) {
        console.error('Error removing media from SQLite:', error);
      }
    }
  };

  const updateLocation = (location: Location) => {
    setSubmissionState((prev) => ({
      ...prev,
      currentLocation: location,
      updatedAt: new Date().toISOString(),
    }));
  };

  const saveToSQLite = async (status: SubmissionStatus) => {
    const db = database.getDatabase();
    if (!db || !submissionState.submissionId) {
      console.error('Cannot save: database or submission ID missing');
      return;
    }

    setIsLoading(true);

    try {
      const networkState = await NetInfo.fetch();
      const now = new Date().toISOString();

      // Update submission status
      await db.runAsync(
        `UPDATE submissions 
         SET syncStatus = ?, 
             geoLat = ?, 
             geoLng = ?,
             updatedAt = ?
         WHERE localUuid = ?`,
        [
          status === 'PENDING_SYNC' ? 'PENDING' : 'SYNCED',
          submissionState.currentLocation?.latitude || 0,
          submissionState.currentLocation?.longitude || 0,
          now,
          submissionState.submissionId,
        ]
      );

      // Store capture context
      const captureContext = {
        isOffline: !networkState.isConnected,
        networkType: networkState.type || 'unknown',
        submittedAt: now,
      };

      await AsyncStorage.setItem(
        `submission_context_${submissionState.submissionId}`,
        JSON.stringify(captureContext)
      );

      setSubmissionState((prev) => ({
        ...prev,
        status,
        captureContext,
        updatedAt: now,
      }));

      console.log(`Submission saved with status: ${status}`);
    } catch (error) {
      console.error('Error saving submission:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetSubmission = () => {
    setSubmissionState({
      submissionId: null,
      loanDetails: null,
      media: [],
      currentLocation: null,
      status: 'DRAFT',
    });
  };

  return (
    <SubmissionContext.Provider
      value={{
        submissionState,
        initializeSubmission,
        addMedia,
        removeMedia,
        updateLocation,
        saveToSQLite,
        resetSubmission,
        isLoading,
      }}
    >
      {children}
    </SubmissionContext.Provider>
  );
}
