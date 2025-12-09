// apps/mobileapp/contexts/LocationContext.tsx
import * as Location from 'expo-location';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { updateUserProfile } from '../api/authService';
import { useAuth } from './AuthContext';

interface UserLocation {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: string;
}

interface LocationContextType {
  userHomeLocation: UserLocation | null;
  hasSetLocation: boolean;
  isLocationPopupVisible: boolean;
  saveHomeLocation: (location: UserLocation) => Promise<void>;
  dismissLocationPopup: () => void;
  showLocationPopup: () => void;
  getCurrentLocation: () => Promise<UserLocation | null>;
  isLoading: boolean;
  hasTemporarilyDismissed: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const { user, token, refreshUserFromBackend } = useAuth();
  const [userHomeLocation, setUserHomeLocation] = useState<UserLocation | null>(null);
  const [hasSetLocation, setHasSetLocation] = useState(false);
  const [isLocationPopupVisible, setIsLocationPopupVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasTemporarilyDismissed, setHasTemporarilyDismissed] = useState(false);

  // Check location when user changes
  useEffect(() => {
    if (user) {
      setIsLoading(true);
      
      try {
        // Check if homeLat and homeLng exist and are not 0
        const hasLocation = user.homeLat && user.homeLng && user.homeLat !== 0 && user.homeLng !== 0;
        
        if (hasLocation) {
          setUserHomeLocation({
            latitude: user.homeLat!,
            longitude: user.homeLng!,
            timestamp: new Date().toISOString(),
          });
          setHasSetLocation(true);
          setIsLocationPopupVisible(false);
        } else {
          // Show popup if location not set - reset temporary dismissal when user changes
          setUserHomeLocation(null);
          setHasSetLocation(false);
          setHasTemporarilyDismissed(false);
          setIsLocationPopupVisible(true);
        }
      } catch (error) {
        console.error('Error checking user location:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Reset when user logs out
      setUserHomeLocation(null);
      setHasSetLocation(false);
      setIsLocationPopupVisible(false);
      setIsLoading(false);
      setHasTemporarilyDismissed(false);
    }
  }, [user]);

  const saveHomeLocation = async (location: UserLocation) => {
    if (!user || !token) {
      throw new Error('User not logged in');
    }

    try {
      // Update location in the database via API
      const response = await updateUserProfile(
        user._id,
        {
          homeLat: location.latitude,
          homeLng: location.longitude,
        },
        token
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to save location');
      }

      // Update local state
      setUserHomeLocation(location);
      setHasSetLocation(true);
      setIsLocationPopupVisible(false);
      
      // Refresh user data from backend to sync changes
      await refreshUserFromBackend();
      
      console.log(`Home location saved successfully for user ${user._id}`);
    } catch (error) {
      console.error('Error saving location:', error);
      throw error;
    }
  };

  const dismissLocationPopup = () => {
    setIsLocationPopupVisible(false);
    setHasTemporarilyDismissed(true);
  };

  const showLocationPopup = () => {
    if (!hasSetLocation && !hasTemporarilyDismissed) {
      setIsLocationPopupVisible(true);
    }
  };

  const getCurrentLocation = async (): Promise<UserLocation | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission not granted');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({});
      
      // Try to get address (optional)
      let address = undefined;
      try {
        const [geocode] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        if (geocode) {
          address = `${geocode.street || ''}, ${geocode.city || ''}, ${geocode.region || ''}`.trim();
        }
      } catch (e) {
        console.log('Geocoding failed:', e);
      }

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  };

  return (
    <LocationContext.Provider
      value={{
        userHomeLocation,
        hasSetLocation,
        isLocationPopupVisible,
        saveHomeLocation,
        dismissLocationPopup,
        showLocationPopup,
        getCurrentLocation,
        isLoading,
        hasTemporarilyDismissed,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
