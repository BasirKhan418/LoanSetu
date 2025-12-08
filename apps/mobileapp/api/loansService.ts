/**
 * Loans Service
 * Handles all loan-related API calls
 */

import { apiRequest, ApiResponse } from './config';

export interface LoanDetails {
  _id: string;
  name: string;
  schemeName: string;
  schemeCode: string;
  description?: string;
  minAmount?: number;
  maxAmount?: number;
  interestRate?: number;
  tenure?: string;
}

export interface Loan {
  _id: string;
  loanNumber: string;
  loanDetailsId: LoanDetails;
  sanctionAmount: number;
  sanctionDate: string;
  disbursementMode?: string;
  verificationStatus: string;
  currency?: string;
  beneficiaryId: {
    _id: string;
    name: string;
    phone: string;
    email?: string;
  };
  bankid: {
    _id: string;
    name: string;
    ifsc: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface GetLoansResponse {
  success: boolean;
  message: string;
  data: Loan[];
}

/**
 * Get all loans for the authenticated user
 * @param phone - User's phone number
 * @returns Promise with loans data
 */
export async function getUserLoans(phone: string): Promise<GetLoansResponse> {
  try {
    const response = await apiRequest<{ success: boolean; message: string; data: Loan[] }>(
      '/api/userloans',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      }
    );
    
    if (response.data && Array.isArray(response.data)) {
      return {
        success: response.success,
        message: response.message,
        data: response.data,
      };
    }
    
    return {
      success: false,
      message: 'Invalid response format',
      data: [],
    };
  } catch (error: any) {
    console.error('[LoansService] Get loans error:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch loans',
      data: [],
    };
  }
}

/**
 * Get loan by ID
 * @param loanId - Loan ID
 * @param token - Authentication token
 * @returns Promise with loan data
 */
export async function getLoanById(loanId: string, token: string): Promise<ApiResponse<Loan>> {
  try {
    const response = await apiRequest<Loan>(
      `/api/userauth/loans/${loanId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response;
  } catch (error: any) {
    console.error('[LoansService] Get loan by ID error:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch loan details',
    };
  }
}
