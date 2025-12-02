import React, { createContext, useContext, useEffect, useState } from 'react';
// Note: You'll need to install AsyncStorage: npx expo install @react-native-async-storage/async-storage
// For now, using simple state management

interface User {
  id: string;
  mobile: string;
  name: string;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  sendOTP: (mobile: string) => Promise<{ success: boolean; message: string }>;
  verifyOTP: (mobile: string, otp: string) => Promise<{ success: boolean; message: string; user?: User }>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Mock database of admin-added users
const mockUsers: User[] = [
  { id: '1', mobile: '+919876543210', name: 'John Doe', isActive: true },
  { id: '2', mobile: '+919876543211', name: 'Jane Smith', isActive: true },
  { id: '3', mobile: '+919876543212', name: 'Bob Johnson', isActive: false },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      // For now using localStorage simulation - replace with AsyncStorage when installed
      const storedUser = localStorage?.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendOTP = async (mobile: string): Promise<{ success: boolean; message: string }> => {
    try {
      setIsLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if mobile number exists in admin-added users
      const foundUser = mockUsers.find(user => user.mobile === mobile);
      
      if (!foundUser) {
        return { success: false, message: 'Mobile number not registered. Please contact admin.' };
      }
      
      if (!foundUser.isActive) {
        return { success: false, message: 'Account is inactive. Please contact admin.' };
      }
      
      // In real app, send OTP via SMS service
      console.log(`OTP sent to ${mobile}: 123456`);
      return { success: true, message: 'OTP sent successfully!' };
      
    } catch (error) {
      console.error('Send OTP failed:', error);
      return { success: false, message: 'Failed to send OTP. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (mobile: string, otp: string): Promise<{ success: boolean; message: string; user?: User }> => {
    try {
      setIsLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find user by mobile
      const foundUser = mockUsers.find(user => user.mobile === mobile && user.isActive);
      
      if (!foundUser) {
        return { success: false, message: 'Invalid mobile number or account inactive.' };
      }
      
      // Mock OTP verification (in real app, verify with backend)
      if (otp === '123456') {
        // Store user session
        localStorage?.setItem('user', JSON.stringify(foundUser));
        setUser(foundUser);
        return { success: true, message: 'Login successful!', user: foundUser };
      } else {
        return { success: false, message: 'Invalid OTP. Please try again.' };
      }
      
    } catch (error) {
      console.error('OTP verification failed:', error);
      return { success: false, message: 'Verification failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      localStorage?.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, sendOTP, verifyOTP, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}