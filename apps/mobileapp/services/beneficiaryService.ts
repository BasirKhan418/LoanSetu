// apps/mobileapp/services/beneficiaryService.ts
import { database, Beneficiary } from '../database/schema';

export class BeneficiaryService {
  /**
   * Create or update beneficiary
   * Returns the beneficiary ID (either existing or newly created)
   */
  async saveBeneficiary(data: {
    beneficiaryId?: string;
    name: string;
    mobileNumber: string;
    schemeName?: string;
  }): Promise<number> {
    const db = database.getDatabase();
    const now = new Date().toISOString();

    try {
      // Check if beneficiary exists by mobile number
      const existing = await db.getFirstAsync<{ id: number }>(
        'SELECT id FROM beneficiaries WHERE mobileNumber = ?',
        [data.mobileNumber]
      );

      if (existing) {
        // Update existing beneficiary
        await db.runAsync(
          `UPDATE beneficiaries 
           SET name = ?, schemeName = ?, beneficiaryId = ?, updatedAt = ?
           WHERE id = ?`,
          [
            data.name,
            data.schemeName || null,
            data.beneficiaryId || null,
            now,
            existing.id
          ]
        );
        console.log(`Beneficiary updated: ${existing.id}`);
        return existing.id;
      } else {
        // Insert new beneficiary
        const result = await db.runAsync(
          `INSERT INTO beneficiaries (beneficiaryId, name, mobileNumber, schemeName, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            data.beneficiaryId || null,
            data.name,
            data.mobileNumber,
            data.schemeName || null,
            now,
            now
          ]
        );
        console.log(`Beneficiary created: ${result.lastInsertRowId}`);
        return result.lastInsertRowId;
      }
    } catch (error) {
      console.error('Error saving beneficiary:', error);
      throw error;
    }
  }

  /**
   * Get beneficiary by mobile number
   */
  async getBeneficiaryByMobile(mobileNumber: string): Promise<Beneficiary | null> {
    const db = database.getDatabase();
    
    try {
      const beneficiary = await db.getFirstAsync<Beneficiary>(
        'SELECT * FROM beneficiaries WHERE mobileNumber = ?',
        [mobileNumber]
      );
      return beneficiary || null;
    } catch (error) {
      console.error('Error getting beneficiary by mobile:', error);
      throw error;
    }
  }

  /**
   * Get beneficiary by ID
   */
  async getBeneficiaryById(id: number): Promise<Beneficiary | null> {
    const db = database.getDatabase();
    
    try {
      const beneficiary = await db.getFirstAsync<Beneficiary>(
        'SELECT * FROM beneficiaries WHERE id = ?',
        [id]
      );
      return beneficiary || null;
    } catch (error) {
      console.error('Error getting beneficiary by ID:', error);
      throw error;
    }
  }

  /**
   * Get all beneficiaries
   */
  async getAllBeneficiaries(): Promise<Beneficiary[]> {
    const db = database.getDatabase();
    
    try {
      const beneficiaries = await db.getAllAsync<Beneficiary>(
        'SELECT * FROM beneficiaries ORDER BY createdAt DESC'
      );
      return beneficiaries;
    } catch (error) {
      console.error('Error getting all beneficiaries:', error);
      throw error;
    }
  }

  /**
   * Update beneficiary information
   */
  async updateBeneficiary(id: number, data: Partial<Beneficiary>): Promise<void> {
    const db = database.getDatabase();
    const now = new Date().toISOString();

    try {
      const updates: string[] = [];
      const values: any[] = [];

      if (data.name !== undefined) {
        updates.push('name = ?');
        values.push(data.name);
      }
      if (data.schemeName !== undefined) {
        updates.push('schemeName = ?');
        values.push(data.schemeName);
      }
      if (data.beneficiaryId !== undefined) {
        updates.push('beneficiaryId = ?');
        values.push(data.beneficiaryId);
      }

      if (updates.length === 0) {
        return; // Nothing to update
      }

      updates.push('updatedAt = ?');
      values.push(now);
      values.push(id);

      const query = `UPDATE beneficiaries SET ${updates.join(', ')} WHERE id = ?`;
      await db.runAsync(query, values);
      console.log(`Beneficiary ${id} updated`);
    } catch (error) {
      console.error('Error updating beneficiary:', error);
      throw error;
    }
  }

  /**
   * Delete beneficiary and all associated submissions (CASCADE)
   */
  async deleteBeneficiary(id: number): Promise<void> {
    const db = database.getDatabase();
    
    try {
      await db.runAsync('DELETE FROM beneficiaries WHERE id = ?', [id]);
      console.log(`Beneficiary ${id} deleted`);
    } catch (error) {
      console.error('Error deleting beneficiary:', error);
      throw error;
    }
  }

  /**
   * Count total beneficiaries
   */
  async countBeneficiaries(): Promise<number> {
    const db = database.getDatabase();
    
    try {
      const result = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM beneficiaries'
      );
      return result?.count || 0;
    } catch (error) {
      console.error('Error counting beneficiaries:', error);
      throw error;
    }
  }
}

export const beneficiaryService = new BeneficiaryService();