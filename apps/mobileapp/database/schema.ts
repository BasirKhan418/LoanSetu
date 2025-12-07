// apps/mobileapp/database/schema.ts
import * as SQLite from 'expo-sqlite';

export interface Beneficiary {
  id: number;
  beneficiaryId?: string; // server ID
  name: string;
  mobileNumber: string;
  schemeName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  id: number;
  localUuid: string;
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
  syncStatus: 'PENDING' | 'SYNCED' | 'FAILED';
  lastSyncAttemptAt?: string;
  remoteId?: string;
  errorMessage?: string;
  retryCount: number;
  createdAt: string;
  syncedAt?: string;
}

export interface MediaFile {
  id: number;
  submissionId: number;
  type: 'PHOTO' | 'VIDEO' | 'INVOICE';
  photoType?: 'front' | 'back' | 'left' | 'right';
  localPath: string;
  mimeType: string;
  fileSize: number;
  geoLat: number;
  geoLng: number;
  timestamp: string;
  createdAt: string;
}

export class Database {
  private db: SQLite.SQLiteDatabase | null = null;

  async init() {
    try {
      this.db = await SQLite.openDatabaseAsync('loanVerification.db');
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  private async createTables() {
    if (!this.db) throw new Error('Database not initialized');

    // Create beneficiaries table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS beneficiaries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        beneficiaryId TEXT,
        name TEXT NOT NULL,
        mobileNumber TEXT NOT NULL UNIQUE,
        schemeName TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);

    // Create submissions table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        localUuid TEXT NOT NULL UNIQUE,
        beneficiaryId INTEGER NOT NULL,
        loanId TEXT,
        loanReferenceId TEXT,
        loanSchemeName TEXT,
        loanAmount TEXT,
        productName TEXT NOT NULL,
        productDetails TEXT NOT NULL,
        geoLat REAL NOT NULL,
        geoLng REAL NOT NULL,
        submittedBy TEXT NOT NULL CHECK(submittedBy IN ('beneficiary', 'officer')),
        syncStatus TEXT NOT NULL DEFAULT 'PENDING' CHECK(syncStatus IN ('PENDING', 'SYNCED', 'FAILED')),
        lastSyncAttemptAt TEXT,
        remoteId TEXT,
        errorMessage TEXT,
        retryCount INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        syncedAt TEXT,
        FOREIGN KEY (beneficiaryId) REFERENCES beneficiaries (id)
      );
    `);

    // Create media_files table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS media_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        submissionId INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('PHOTO', 'VIDEO', 'INVOICE')),
        photoType TEXT CHECK(photoType IN ('front', 'back', 'left', 'right')),
        localPath TEXT NOT NULL,
        mimeType TEXT NOT NULL,
        fileSize INTEGER NOT NULL,
        geoLat REAL NOT NULL,
        geoLng REAL NOT NULL,
        timestamp TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (submissionId) REFERENCES submissions (id) ON DELETE CASCADE
      );
    `);

    // Create indexes for better query performance
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_submissions_syncStatus ON submissions(syncStatus);
      CREATE INDEX IF NOT EXISTS idx_submissions_beneficiaryId ON submissions(beneficiaryId);
      CREATE INDEX IF NOT EXISTS idx_media_files_submissionId ON media_files(submissionId);
    `);

    console.log('Database tables created successfully');
  }

  getDatabase(): SQLite.SQLiteDatabase {
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }

  async close() {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}

// Singleton instance
export const database = new Database();