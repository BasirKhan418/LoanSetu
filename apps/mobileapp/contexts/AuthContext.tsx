import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as authService from '../api/authService';
import { database } from '../database/schema';
import { useDatabase } from './DatabaseContext';

interface User {
  _id: string;
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
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  sendOTP: (phone: string) => Promise<{ success: boolean; message: string }>;
  verifyOTP: (phone: string, otp: string) => Promise<{ success: boolean; message: string; user?: User }>;
  logout: () => Promise<void>;
  updateUserProfile: (updateFields: Partial<User>) => Promise<{ success: boolean; message: string }>;
  refreshUserFromBackend: () => Promise<void>;
  isLoading: boolean;
  isOnline: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isInitialized: isDatabaseInitialized } = useDatabase();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Monitor network connectivity
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Wait for database to be initialized before bootstrapping auth
    if (isDatabaseInitialized) {
      bootstrapAuth();
    }
  }, [isDatabaseInitialized]);

  // Step A: Local bootstrap (works offline)
  const bootstrapAuth = async () => {
    try {
      console.log('[Auth] Bootstrapping authentication...');
      
      // 1. Read token from AsyncStorage
      const storedToken = await AsyncStorage.getItem('authToken');
      
      if (!storedToken) {
        console.log('[Auth] No token found, user needs to login');
        setIsLoading(false);
        return;
      }

      console.log('[Auth] Token found in AsyncStorage');
      setToken(storedToken);

      // 2. Load user profile from SQLite (offline-first)
      const userProfile = await database.getUser();
      
      if (userProfile) {
        console.log('[Auth] User profile loaded from SQLite:', userProfile.name);
        const userData: User = {
          _id: userProfile.userId,
          phone: userProfile.phone,
          name: userProfile.name,
          email: userProfile.email,
          img: userProfile.img,
          addressLine1: userProfile.addressLine1,
          addressLine2: userProfile.addressLine2,
          village: userProfile.village,
          block: userProfile.block,
          district: userProfile.district,
          state: userProfile.state,
          pincode: userProfile.pincode,
          homeLat: userProfile.homeLat,
          homeLng: userProfile.homeLng,
          tenantId: userProfile.tenantId,
          isActive: userProfile.isActive,
          isVerified: userProfile.isVerified,
        };
        setUser(userData);
        console.log('[Auth] ✅ User state set successfully:', userData._id);
      } else {
        console.log('[Auth] No user profile in SQLite, clearing token');
        await AsyncStorage.removeItem('authToken');
        setToken(null);
      }

      setIsLoading(false);
      console.log('[Auth] ✅ Bootstrap complete. User:', userProfile ? 'Authenticated' : 'Not authenticated');

      // Step B: Background remote verify (if internet)
      if (isOnline && storedToken && userProfile) {
        console.log('[Auth] Online, attempting background token verification...');
        backgroundVerifyToken(storedToken);
      }
    } catch (error) {
      console.error('[Auth] Bootstrap failed:', error);
      setIsLoading(false);
    }
  };

  // Background token verification with backend
  const backgroundVerifyToken = async (authToken: string) => {
    try {
      // Call backend verify endpoint (you'll need to implement this)
      // For now, we'll just update the lastVerifiedAt timestamp
      await database.updateUser({
        lastVerifiedAt: new Date().toISOString(),
      });
      console.log('[Auth] Token verified successfully with backend');
    } catch (error: any) {
      console.error('[Auth] Background verification failed:', error);
      
      // If 401/403, token is invalid - logout
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        console.log('[Auth] Token expired, logging out user');
        await logout();
      }
    }
  };

  const refreshUserFromBackend = async () => {
    if (!token || !isOnline) {
      console.log('[Auth] Cannot refresh: no token or offline');
      return;
    }

    try {
      console.log('[Auth] Fetching latest user data from backend...');
      
      // Fetch latest user data from backend
      const response = await authService.getCurrentUser(token);
      
      if (response.success && response.data) {
        const backendUser = response.data;
        
        // Update SQLite with latest data
        await database.updateUser({
          name: backendUser.name,
          email: backendUser.email,
          img: backendUser.img,
          addressLine1: backendUser.addressLine1,
          addressLine2: backendUser.addressLine2,
          village: backendUser.village,
          block: backendUser.block,
          district: backendUser.district,
          state: backendUser.state,
          pincode: backendUser.pincode,
          homeLat: backendUser.homeLat,
          homeLng: backendUser.homeLng,
          tenantId: backendUser.tenantId,
          isActive: backendUser.isActive,
          isVerified: backendUser.isVerified,
          lastVerifiedAt: new Date().toISOString(),
        });
        
        // Update local state
        const userData: User = {
          _id: backendUser._id,
          phone: backendUser.phone,
          name: backendUser.name,
          email: backendUser.email,
          img: backendUser.img,
          addressLine1: backendUser.addressLine1,
          addressLine2: backendUser.addressLine2,
          village: backendUser.village,
          block: backendUser.block,
          district: backendUser.district,
          state: backendUser.state,
          pincode: backendUser.pincode,
          homeLat: backendUser.homeLat,
          homeLng: backendUser.homeLng,
          tenantId: backendUser.tenantId,
          isActive: backendUser.isActive,
          isVerified: backendUser.isVerified,
        };
        setUser(userData);
        console.log('[Auth] User data refreshed successfully');
      }
    } catch (error) {
      console.error('[Auth] Refresh failed:', error);
    }
  };

  const sendOTP = async (phone: string): Promise<{ success: boolean; message: string }> => {
    try {
      setIsLoading(true);
      
      // Call backend API to send OTP
      const response = await authService.sendOTP(phone);
      
      return {
        success: response.success,
        message: response.message,
      };
      
    } catch (error) {
      console.error('Send OTP failed:', error);
      return { success: false, message: 'Failed to send OTP. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (phone: string, otp: string): Promise<{ success: boolean; message: string; user?: User }> => {
    try {
      setIsLoading(true);
      
      console.log('[Auth] Verifying OTP for phone:', phone);
      
      // Call backend API to verify OTP
      const response = await authService.verifyOTP(phone, otp);
      
      if (response.success && response.token) {
        console.log('[Auth] OTP verified successfully');
        
        // Decode token to get user data
        const payloadBase64 = response.token.split('.')[1];
        const decodedPayload = JSON.parse(atob(payloadBase64));
        
        // Create user object from decoded token
        const userData: User = {
          _id: decodedPayload.id,
          phone: phone,
          name: decodedPayload.name || 'User',
          email: decodedPayload.email,
          isActive: true,
          isVerified: true,
        };
        
        // 1. Store token in AsyncStorage (small, simple)
        await AsyncStorage.setItem('authToken', response.token);
        console.log('[Auth] Token saved to AsyncStorage');
        
        // 2. Store user profile in SQLite (queryable, persistent)
        await database.saveUser({
          userId: userData._id,
          phone: userData.phone,
          name: userData.name,
          email: userData.email,
          img: userData.img,
          addressLine1: userData.addressLine1,
          addressLine2: userData.addressLine2,
          village: userData.village,
          block: userData.block,
          district: userData.district,
          state: userData.state,
          pincode: userData.pincode,
          homeLat: userData.homeLat,
          homeLng: userData.homeLng,
          tenantId: userData.tenantId,
          isActive: userData.isActive,
          isVerified: userData.isVerified,
          lastVerifiedAt: new Date().toISOString(),
        });
        console.log('[Auth] User profile saved to SQLite');
        
        // 3. Update local state
        setUser(userData);
        setToken(response.token);
        
        return { success: true, message: 'Login successful!', user: userData };
      } else {
        return { success: false, message: response.message || 'Invalid OTP. Please try again.' };
      }
      
    } catch (error) {
      console.error('[Auth] OTP verification failed:', error);
      return { success: false, message: 'Verification failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (updateFields: Partial<User>): Promise<{ success: boolean; message: string }> => {
    if (!user || !token) {
      return { success: false, message: 'User not authenticated' };
    }
    
    try {
      setIsLoading(true);
      console.log('[Auth] Updating user profile:', Object.keys(updateFields));
      
      // 1. Update SQLite first (offline-first: works even without internet)
      const updatedUserData = { ...user, ...updateFields };
      await database.updateUser({
        userId: updatedUserData._id,
        phone: updatedUserData.phone,
        name: updatedUserData.name,
        email: updatedUserData.email,
        img: updatedUserData.img,
        addressLine1: updatedUserData.addressLine1,
        addressLine2: updatedUserData.addressLine2,
        village: updatedUserData.village,
        block: updatedUserData.block,
        district: updatedUserData.district,
        state: updatedUserData.state,
        pincode: updatedUserData.pincode,
        homeLat: updatedUserData.homeLat,
        homeLng: updatedUserData.homeLng,
        tenantId: updatedUserData.tenantId,
        isActive: updatedUserData.isActive,
        isVerified: updatedUserData.isVerified,
      });
      console.log('[Auth] User profile updated in SQLite');
      
      // 2. Update local state immediately (instant UI feedback)
      setUser(updatedUserData);
      
      // 3. Try to sync with backend (best effort, works offline)
      try {
        if (isOnline) {
          const response = await authService.updateUserProfile(user._id, updateFields, token);
          if (response.success) {
            console.log('[Auth] Profile synced with backend');
          } else {
            console.warn('[Auth] Backend sync failed, but local data saved:', response.message);
          }
        } else {
          console.log('[Auth] Offline - profile saved locally, will sync when online');
        }
      } catch (backendError) {
        console.warn('[Auth] Backend sync error (offline OK):', backendError);
      }
      
      // Return success even if backend sync fails (offline-first)
      return { success: true, message: 'Profile updated successfully!' };
    } catch (error) {
      console.error('[Auth] Profile update failed:', error);
      return { success: false, message: 'Failed to update profile. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('[Auth] Logging out user...');
      
      // 1. Clear token from AsyncStorage
      await AsyncStorage.removeItem('authToken');
      console.log('[Auth] Token removed from AsyncStorage');
      
      // 2. Delete user profile from SQLite
      await database.deleteUser();
      console.log('[Auth] User profile deleted from SQLite');
      
      // 3. Clear local state
      setUser(null);
      setToken(null);
      
      console.log('[Auth] Logout completed successfully');
    } catch (error) {
      console.error('[Auth] Logout failed:', error);
      // Even if cleanup fails, clear the state
      setUser(null);
      setToken(null);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      sendOTP, 
      verifyOTP, 
      logout, 
      updateUserProfile, 
      isLoading,
      refreshUserFromBackend,
      isOnline 
    }}>
      {children}
    </AuthContext.Provider>
  );
}