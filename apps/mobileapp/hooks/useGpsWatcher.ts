// apps/mobileapp/hooks/useGpsWatcher.ts
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { Location as LocationType } from '../types/submission';
import { useSubmission } from '../contexts/SubmissionContext';

interface GpsWatcherState {
  location: LocationType | null;
  status: 'searching' | 'locked' | 'error' | 'disabled';
  error: string | null;
  accuracy: number | null;
  distanceFromExpected: number | null;
}

/**
 * Custom hook to watch GPS location continuously
 * Automatically updates SubmissionContext with latest location
 */
export function useGpsWatcher(
  expectedLocation?: { latitude: number; longitude: number }
) {
  const { updateLocation } = useSubmission();
  const [state, setState] = useState<GpsWatcherState>({
    location: null,
    status: 'searching',
    error: null,
    accuracy: null,
    distanceFromExpected: null,
  });

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let isMounted = true;

    const startWatching = async () => {
      try {
        // Request permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          if (isMounted) {
            setState((prev) => ({
              ...prev,
              status: 'disabled',
              error: 'Location permission denied',
            }));
          }
          return;
        }

        // Check if location services are enabled
        const locationEnabled = await Location.hasServicesEnabledAsync();
        if (!locationEnabled) {
          if (isMounted) {
            setState((prev) => ({
              ...prev,
              status: 'disabled',
              error: 'Location services are disabled',
            }));
          }
          return;
        }

        if (isMounted) {
          setState((prev) => ({ ...prev, status: 'searching' }));
        }

        // Start watching location
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000, // Update every 5 seconds
            distanceInterval: 10, // Or when moved 10 meters
          },
          (locationUpdate) => {
            if (!isMounted) return;

            const { coords, mocked } = locationUpdate;

            // Detect mock location
            const isMockLocation = mocked !== undefined ? mocked : false;

            const newLocation: LocationType = {
              latitude: coords.latitude,
              longitude: coords.longitude,
              accuracy: coords.accuracy || 0,
              timestamp: new Date().toISOString(),
              isMockLocation,
            };

            // Calculate distance from expected location if provided
            let distance: number | null = null;
            if (expectedLocation) {
              distance = calculateDistance(
                coords.latitude,
                coords.longitude,
                expectedLocation.latitude,
                expectedLocation.longitude
              );
            }

            setState({
              location: newLocation,
              status: coords.accuracy && coords.accuracy < 50 ? 'locked' : 'searching',
              error: isMockLocation ? 'Mock location detected' : null,
              accuracy: coords.accuracy || null,
              distanceFromExpected: distance,
            });

            // Update SubmissionContext
            updateLocation(newLocation);
          }
        );
      } catch (error) {
        console.error('GPS Watcher Error:', error);
        if (isMounted) {
          setState((prev) => ({
            ...prev,
            status: 'error',
            error: 'Failed to start location tracking',
          }));
        }
      }
    };

    startWatching();

    // Cleanup
    return () => {
      isMounted = false;
      if (subscription) {
        subscription.remove();
      }
    };
  }, [expectedLocation?.latitude, expectedLocation?.longitude]);

  return state;
}

/**
 * Calculate distance between two GPS coordinates in kilometers
 * Uses Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
