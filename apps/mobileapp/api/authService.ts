/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import { API_ENDPOINTS, apiRequest, ApiResponse } from './config';

export interface User {
  _id: string;
  name: string;
  phone: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface SendOTPResponse {
  success: boolean;
  message: string;
  status?: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

/**
 * Send OTP to user's phone number
 * @param phone - 10 digit phone number without country code
 * @returns Promise with OTP send status
 */
export async function sendOTP(phone: string): Promise<SendOTPResponse> {
  try {
    const response = await apiRequest<SendOTPResponse>(
      API_ENDPOINTS.AUTH.USER_AUTH,
      {
        method: 'POST',
        body: JSON.stringify({
          phone: phone,
        }),
      }
    );

    return {
      success: response.success,
      message: response.message,
      status: response.data?.status,
    };
  } catch (error) {
    console.error('Send OTP Error:', error);
    return {
      success: false,
      message: 'Failed to send OTP. Please try again.',
    };
  }
}

/**
 * Verify OTP and authenticate user
 * @param phone - 10 digit phone number without country code
 * @param otp - 6 digit OTP
 * @returns Promise with authentication token and user data
 */
export async function verifyOTP(
  phone: string,
  otp: string
): Promise<VerifyOTPResponse> {
  try {
    const response = await apiRequest<VerifyOTPResponse>(
      API_ENDPOINTS.AUTH.VALIDATE_OTP,
      {
        method: 'POST',
        body: JSON.stringify({
          phone: phone,
          otp: otp,
        }),
      }
    );

    if (response.success && response.token) {
      return {
        success: true,
        message: response.message,
        token: response.token,
      };
    }

    return {
      success: false,
      message: response.message || 'Verification failed',
    };
  } catch (error) {
    console.error('Verify OTP Error:', error);
    return {
      success: false,
      message: 'Failed to verify OTP. Please try again.',
    };
  }
}

/**
 * Update user profile information
 * @param userId - User's ID (not used in new endpoint, token identifies user)
 * @param updateFields - Fields to update
 * @param token - Authentication token
 * @returns Promise with update status
 */
export async function updateUserProfile(
  userId: string,
  updateFields: Partial<User>,
  token: string
): Promise<ApiResponse> {
  try {
    const response = await apiRequest(API_ENDPOINTS.AUTH.ME, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updateFields),
    });

    return response;
  } catch (error) {
    console.error('Update User Profile Error:', error);
    return {
      success: false,
      message: 'Failed to update profile. Please try again.',
    };
  }
}

/**
 * Get current user profile
 * @param token - Authentication token
 * @returns Promise with user data
 */
export async function getCurrentUser(token: string): Promise<ApiResponse<User>> {
  try {
    const response = await apiRequest<User>(API_ENDPOINTS.AUTH.ME, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response;
  } catch (error) {
    console.error('Get Current User Error:', error);
    return {
      success: false,
      message: 'Failed to fetch user profile. Please try again.',
    };
  }
}
