// apps/mobileapp/contexts/LocationContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import React, { createContext, useContext, useEffect, useState } from 'react';
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
  const { user } = useAuth();
  const [userHomeLocation, setUserHomeLocation] = useState<UserLocation | null>(null);
  const [hasSetLocation, setHasSetLocation] = useState(false);
  const [isLocationPopupVisible, setIsLocationPopupVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasTemporarilyDismissed, setHasTemporarilyDismissed] = useState(false);

  const getLocationStorageKey = (userId: string) => {
    return `@user_location_${userId}`;
  };

  const loadStoredLocation = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const storageKey = getLocationStorageKey(user._id);
      const storedLocation = await AsyncStorage.getItem(storageKey);
      if (storedLocation) {
        const location = JSON.parse(storedLocation);
        setUserHomeLocation(location);
        setHasSetLocation(true);
        setIsLocationPopupVisible(false);
      } else {
        // Show popup if location not set for this user and not temporarily dismissed
        setIsLocationPopupVisible(!hasTemporarilyDismissed);
      }
    } catch (error) {
      console.error('Error loading stored location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load location when user changes
  useEffect(() => {
    if (user) {
      // Reset temporary dismissal flag on app reopen (user change)
      setHasTemporarilyDismissed(false);
      loadStoredLocation();
    } else {
      // Reset when user logs out
      setUserHomeLocation(null);
      setHasSetLocation(false);
      setIsLocationPopupVisible(false);
      setIsLoading(false);
      setHasTemporarilyDismissed(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const saveHomeLocation = async (location: UserLocation) => {
    if (!user) {
      throw new Error('User not logged in');
    }

    try {
      const storageKey = getLocationStorageKey(user._id);
      await AsyncStorage.setItem(storageKey, JSON.stringify(location));
      setUserHomeLocation(location);
      setHasSetLocation(true);
      setIsLocationPopupVisible(false);
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
