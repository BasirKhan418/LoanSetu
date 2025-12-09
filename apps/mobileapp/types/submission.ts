// apps/mobileapp/types/submission.ts

export interface LocalMedia {
  id?: number;
  localId: string;
  submissionId?: number;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  photoType?: 'front' | 'back' | 'left' | 'right' | 'general';
  localPath: string;
  mimeType: string;
  sizeInBytes: number;
  gpsLat?: number;
  gpsLng?: number;
  gpsAccuracy?: number;
  capturedAt: string;
  duration?: number; // for video in seconds
  width?: number;
  height?: number;
  isMockLocation?: boolean;
  uploadedUrl?: string;
  uploadStatus?: 'PENDING' | 'UPLOADING' | 'UPLOADED' | 'FAILED';
  metadata?: string; // JSON string containing EXIF data (device model, OS, GPS, timestamps)
}

export interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  isMockLocation?: boolean;
}

export interface LoanDetails {
  loanId: string;
  loanReferenceId: string;
  beneficiaryId: string;
  beneficiaryName: string;
  schemeName: string;
  sanctionAmount: number;
  sanctionDate: string;
  assetType: string;
  expectedLocation?: {
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  tenantId: string;
}

export interface SubmissionState {
  submissionId: string | null; // local UUID
  loanDetails: LoanDetails | null;
  media: LocalMedia[];
  currentLocation: Location | null;
  status: 'DRAFT' | 'LOCAL_DRAFT' | 'PENDING_SYNC' | 'SYNCED' | 'FAILED';
  captureContext?: {
    isOffline: boolean;
    networkType: string;
    submittedAt: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export type SubmissionStatus = 'DRAFT' | 'LOCAL_DRAFT' | 'PENDING_SYNC' | 'SYNCED' | 'FAILED';
