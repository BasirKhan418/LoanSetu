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
  metadata?: string; // JSON string containing EXIF data
  createdAt: string;
}

export interface UserProfile {
  id: number;
  userId: string;          // Backend _id
  phone: string;
  name: string;
  email?: string;
  img?: string;
  addressLine1?: string;
  addressLine2?: string;
  village?: string;
  block?: string;
  district?: string;
  state?: string;
  pincode?: string;
  homeLat?: number;
  homeLng?: number;
  tenantId?: string;
  isActive: boolean;
  isVerified: boolean;
  lastVerifiedAt?: string; // When token was last verified with backend
  createdAt: string;
  updatedAt: string;
}

export interface Loan {
  id: number;
  loanId: string;          // Backend loan ID (unique)
  beneficiaryId: string;
  beneficiaryName: string;
  loanReferenceId: string;
  schemeName: string;
  sanctionAmount: number;
  sanctionDate: string;
  assetType: string;
  tenantId?: string;
  submissionId?: number;   // Link to submission if exists
  createdAt: string;
  updatedAt: string;
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

    // Run migrations for existing databases
    await this.runMigrations();

    // Create users table (single row for current user)
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY CHECK(id = 1),
        userId TEXT NOT NULL,
        phone TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT,
        img TEXT,
        addressLine1 TEXT,
        addressLine2 TEXT,
        village TEXT,
        block TEXT,
        district TEXT,
        state TEXT,
        pincode TEXT,
        homeLat REAL,
        homeLng REAL,
        tenantId TEXT,
        isActive INTEGER DEFAULT 1,
        isVerified INTEGER DEFAULT 0,
        lastVerifiedAt TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);

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

    // Create loans table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS loans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        loanId TEXT NOT NULL UNIQUE,
        beneficiaryId TEXT NOT NULL,
        beneficiaryName TEXT NOT NULL,
        loanReferenceId TEXT NOT NULL,
        schemeName TEXT NOT NULL,
        sanctionAmount REAL NOT NULL,
        sanctionDate TEXT NOT NULL,
        assetType TEXT NOT NULL,
        tenantId TEXT,
        submissionId INTEGER,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (submissionId) REFERENCES submissions (id) ON DELETE SET NULL
      );
    `);

    // Create submissions table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        localUuid TEXT NOT NULL UNIQUE,
        beneficiaryId TEXT NOT NULL,
        beneficiaryName TEXT,
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
        updatedAt TEXT,
        syncedAt TEXT
      );
    `);

    // Create media_files table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS media_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        submissionId INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('PHOTO', 'VIDEO', 'INVOICE', 'DOCUMENT')),
        photoType TEXT,
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
      CREATE INDEX IF NOT EXISTS idx_submissions_loanId ON submissions(loanId);
      CREATE INDEX IF NOT EXISTS idx_media_files_submissionId ON media_files(submissionId);
      CREATE INDEX IF NOT EXISTS idx_loans_loanId ON loans(loanId);
      CREATE INDEX IF NOT EXISTS idx_loans_beneficiaryId ON loans(beneficiaryId);
    `);

    console.log('Database tables created successfully');
  }

  private async runMigrations() {
    if (!this.db) return;

    try {
      // Check if beneficiaryName column exists in submissions table
      const submissionsInfo = await this.db.getAllAsync<{ name: string }>(
        "PRAGMA table_info(submissions)"
      );
      
      const hasBeneficiaryName = submissionsInfo.some(col => col.name === 'beneficiaryName');
      const hasUpdatedAt = submissionsInfo.some(col => col.name === 'updatedAt');
      
      if (!hasBeneficiaryName) {
        console.log('Running migration: Adding beneficiaryName column');
        await this.db.execAsync(
          'ALTER TABLE submissions ADD COLUMN beneficiaryName TEXT'
        );
        console.log('Migration completed: beneficiaryName column added');
      }

      if (!hasUpdatedAt) {
        console.log('Running migration: Adding updatedAt column');
        await this.db.execAsync(
          'ALTER TABLE submissions ADD COLUMN updatedAt TEXT'
        );
        console.log('Migration completed: updatedAt column added');
      }

      // Check if media_files table has metadata column
      const mediaFilesInfo = await this.db.getAllAsync<{ name: string }>(
        "PRAGMA table_info(media_files)"
      );
      
      const hasMetadata = mediaFilesInfo.some(col => col.name === 'metadata');
      
      if (!hasMetadata) {
        console.log('Running migration: Adding metadata column to media_files');
        await this.db.execAsync(
          'ALTER TABLE media_files ADD COLUMN metadata TEXT'
        );
        console.log('Migration completed: metadata column added');
      }

      // Check if media_files table has old CHECK constraint on photoType
      // We need to recreate the table to remove the constraint
      const mediaInfo = await this.db.getAllAsync<{ sql: string }>(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='media_files'"
      );
      
      if (mediaInfo.length > 0 && mediaInfo[0].sql.includes("photoType IN ('front', 'back', 'left', 'right')")) {
        console.log('Running migration: Recreating media_files table');
        
        // Create backup table
        await this.db.execAsync(`
          CREATE TABLE media_files_backup AS SELECT * FROM media_files;
        `);
        
        // Drop old table
        await this.db.execAsync('DROP TABLE media_files');
        
        // Create new table without CHECK constraint but with metadata column
        await this.db.execAsync(`
          CREATE TABLE media_files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            submissionId INTEGER NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('PHOTO', 'VIDEO', 'INVOICE', 'DOCUMENT')),
            photoType TEXT,
            localPath TEXT NOT NULL,
            mimeType TEXT NOT NULL,
            fileSize INTEGER NOT NULL,
            geoLat REAL NOT NULL,
            geoLng REAL NOT NULL,
            timestamp TEXT NOT NULL,
            metadata TEXT,
            createdAt TEXT NOT NULL,
            FOREIGN KEY (submissionId) REFERENCES submissions (id) ON DELETE CASCADE
          );
        `);
        
        // Restore data
        await this.db.execAsync(`
          INSERT INTO media_files SELECT * FROM media_files_backup;
        `);
        
        // Drop backup
        await this.db.execAsync('DROP TABLE media_files_backup');
        
        console.log('Migration completed: media_files table recreated');
      }
    } catch (error) {
      console.log('Migration check:', error);
      // Ignore errors if table doesn't exist yet
    }
  }

  getDatabase(): SQLite.SQLiteDatabase {
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }

  // User Profile Methods
  async saveUser(userData: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const existing = await this.getUser();

    if (existing) {
      // Update existing user
      await this.db.runAsync(
        `UPDATE users SET 
          userId = ?, phone = ?, name = ?, email = ?, img = ?,
          addressLine1 = ?, addressLine2 = ?, village = ?, block = ?,
          district = ?, state = ?, pincode = ?, homeLat = ?, homeLng = ?,
          tenantId = ?, isActive = ?, isVerified = ?, lastVerifiedAt = ?,
          updatedAt = ?
        WHERE id = 1`,
        [
          userData.userId, userData.phone, userData.name, userData.email || null,
          userData.img || null, userData.addressLine1 || null, userData.addressLine2 || null,
          userData.village || null, userData.block || null, userData.district || null,
          userData.state || null, userData.pincode || null, userData.homeLat || null,
          userData.homeLng || null, userData.tenantId || null,
          userData.isActive ? 1 : 0, userData.isVerified ? 1 : 0,
          userData.lastVerifiedAt || null, now
        ]
      );
    } else {
      // Insert new user
      await this.db.runAsync(
        `INSERT INTO users (
          id, userId, phone, name, email, img, addressLine1, addressLine2,
          village, block, district, state, pincode, homeLat, homeLng,
          tenantId, isActive, isVerified, lastVerifiedAt, createdAt, updatedAt
        ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userData.userId, userData.phone, userData.name, userData.email || null,
          userData.img || null, userData.addressLine1 || null, userData.addressLine2 || null,
          userData.village || null, userData.block || null, userData.district || null,
          userData.state || null, userData.pincode || null, userData.homeLat || null,
          userData.homeLng || null, userData.tenantId || null,
          userData.isActive ? 1 : 0, userData.isVerified ? 1 : 0,
          userData.lastVerifiedAt || null, now, now
        ]
      );
    }
  }

  async getUser(): Promise<UserProfile | null> {
    if (!this.db) throw new Error('Database not initialized');

    const row = await this.db.getFirstAsync<any>('SELECT * FROM users WHERE id = 1');
    if (!row) return null;

    return {
      id: row.id,
      userId: row.userId,
      phone: row.phone,
      name: row.name,
      email: row.email,
      img: row.img,
      addressLine1: row.addressLine1,
      addressLine2: row.addressLine2,
      village: row.village,
      block: row.block,
      district: row.district,
      state: row.state,
      pincode: row.pincode,
      homeLat: row.homeLat,
      homeLng: row.homeLng,
      tenantId: row.tenantId,
      isActive: row.isActive === 1,
      isVerified: row.isVerified === 1,
      lastVerifiedAt: row.lastVerifiedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async updateUser(updates: Partial<Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>>) {
    if (!this.db) throw new Error('Database not initialized');

    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'isActive' || key === 'isVerified') {
        fields.push(`${key} = ?`);
        values.push(value ? 1 : 0);
      } else if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return;

    fields.push('updatedAt = ?');
    values.push(new Date().toISOString());

    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = 1`;
    await this.db.runAsync(query, values);
  }

  async deleteUser() {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('DELETE FROM users WHERE id = 1');
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