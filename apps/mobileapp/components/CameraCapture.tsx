// apps/mobileapp/components/CameraCapture.tsx
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as FileSystem from 'expo-file-system/legacy';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import uuid from 'react-native-uuid';
import { useSubmission } from '../contexts/SubmissionContext';
import { LocalMedia } from '../types/submission';

interface CameraCaptureProps {
  mode: 'PHOTO' | 'VIDEO';
  onCaptured?: (media: LocalMedia) => void;
  label?: string;
  photoType?: 'front' | 'back' | 'left' | 'right' | 'general' | 'invoice';
}

export function CameraCapture({ mode, onCaptured, label, photoType }: CameraCaptureProps) {
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const { submissionState, addMedia, updateLocation } = useSubmission();

  const recordingTimerRef = useRef<number | null>(null);
  const recordingStartTimeRef = useRef<number | null>(null);
  
  // GPS tracking state
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const locationWatchRef = useRef<Location.LocationSubscription | null>(null);

  // Initialize GPS tracking
  useEffect(() => {
    let isMounted = true;
    
    const startLocationTracking = async () => {
      try {
        // Request location permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' && isMounted) {
          Alert.alert(
            'Location Required',
            'GPS location is required to verify photo authenticity. Photos must be taken at the actual location.',
            [{ text: 'OK', onPress: () => router.back() }]
          );
          return;
        }

        // Get initial location with offline fallback
        console.log('[GPS] Getting initial location...');
        let initialLocation: Location.LocationObject | null = null;
        
        try {
          // First try to get last known position (works offline)
          initialLocation = await Location.getLastKnownPositionAsync({
            maxAge: 60000, // Accept location from last 60 seconds
            requiredAccuracy: 100, // Accept up to 100m accuracy
          });
          
          if (initialLocation) {
            console.log('[GPS] Using last known location (offline mode)');
          }
        } catch (_err) {
          console.error('[GPS] No last known location available', _err);
        }
        
        // If no last known location, get current position
        if (!initialLocation) {
          try {
            initialLocation = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High,
            });
            console.log('[GPS] Got fresh location');
          } catch (err) {
            console.error('[GPS] Failed to get current position:', err);
            // Try with lower accuracy as last resort
            try {
              initialLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              });
              console.log('[GPS] Got location with lower accuracy');
            } catch (finalErr) {
              console.error('[GPS] All location attempts failed:', finalErr);
            }
          }
        }
        
        if (!initialLocation) {
          if (isMounted) {
            setIsLoadingLocation(false);
            Alert.alert(
              'GPS Unavailable',
              'Cannot get GPS location. Please ensure:\n• Location services are enabled\n• You are outdoors or near a window\n• You have a clear view of the sky',
              [{ text: 'OK', onPress: () => router.back() }]
            );
          }
          return;
        }
        
        if (isMounted) {
          setCurrentLocation(initialLocation);
          setLocationAccuracy(initialLocation.coords.accuracy || null);
          updateLocation({
            latitude: initialLocation.coords.latitude,
            longitude: initialLocation.coords.longitude,
            accuracy: initialLocation.coords.accuracy || 0,
            timestamp: new Date().toISOString(),
            isMockLocation: false, // Check this properly in production
          });
          setIsLoadingLocation(false);
          console.log('[GPS] Initial location acquired:', {
            lat: initialLocation.coords.latitude,
            lng: initialLocation.coords.longitude,
            accuracy: initialLocation.coords.accuracy,
          });
        }

        // Start watching location updates
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 2000, // Update every 2 seconds
            distanceInterval: 1, // Update if moved 1 meter
          },
          (location) => {
            if (isMounted) {
              setCurrentLocation(location);
              setLocationAccuracy(location.coords.accuracy || null);
              updateLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy || 0,
                timestamp: new Date().toISOString(),
                isMockLocation: false,
              });
              console.log('[GPS] Location updated:', {
                lat: location.coords.latitude.toFixed(6),
                lng: location.coords.longitude.toFixed(6),
                accuracy: location.coords.accuracy?.toFixed(1),
              });
            }
          }
        );
        
        locationWatchRef.current = subscription;
      } catch (error) {
        console.error('[GPS] Error starting location tracking:', error);
        if (isMounted) {
          setIsLoadingLocation(false);
          Alert.alert(
            'GPS Error',
            'Failed to get your location. Please ensure GPS is enabled and try again.',
            [{ text: 'OK', onPress: () => router.back() }]
          );
        }
      }
    };

    startLocationTracking();

    // Cleanup
    return () => {
      isMounted = false;
      if (locationWatchRef.current) {
        locationWatchRef.current.remove();
        locationWatchRef.current = null;
        console.log('[GPS] Location tracking stopped');
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Request permission if not granted
  if (!permission) {
    return <View style={styles.container}><Text>Loading...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color="#CCC" />
        <Text style={styles.permissionText}>Camera permission is required</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const capturePhoto = async () => {
    if (!cameraRef.current) return;
    
    // Verify GPS is available
    if (!currentLocation) {
      Alert.alert(
        'GPS Not Ready',
        'Waiting for GPS signal. Please ensure you are outdoors or near a window for better signal.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Check GPS accuracy (should be under 50 meters for good accuracy)
    if (locationAccuracy && locationAccuracy > 50) {
      Alert.alert(
        'Poor GPS Accuracy',
        `Current GPS accuracy is ${locationAccuracy.toFixed(0)}m. For better accuracy, please move to an open area.\n\nContinue anyway?`,
        [
          { text: 'Wait', style: 'cancel' },
          { text: 'Continue', onPress: () => proceedWithCapture() },
        ]
      );
      return;
    }

    await proceedWithCapture();
  };

  const proceedWithCapture = async () => {
    if (!cameraRef.current || !currentLocation) return;

    try {
      const captureTimestamp = new Date().toISOString();
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        exif: true, // Include EXIF data
      });

      if (!photo) return;

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(photo.uri);
      
      // Get device info for EXIF metadata
      const deviceModel = Device.modelName || Device.deviceName || 'Unknown Device';
      const deviceManufacturer = Device.manufacturer || 'Unknown';
      const osVersion = Platform.OS === 'ios' 
        ? `iOS ${Device.osVersion}` 
        : `Android ${Device.osVersion}`;
      const appVersion = Constants.expoConfig?.version || '1.0.0';
      
      // Create comprehensive EXIF metadata
      const exifMetadata = {
        // Device Information
        deviceMake: deviceManufacturer,
        deviceModel: deviceModel,
        deviceOS: osVersion,
        appVersion: appVersion,
        // GPS Information (EXIF standard tags)
        gpsLatitude: currentLocation.coords.latitude,
        gpsLongitude: currentLocation.coords.longitude,
        gpsAltitude: currentLocation.coords.altitude || 0,
        gpsAccuracy: currentLocation.coords.accuracy || 0,
        gpsSpeed: currentLocation.coords.speed || 0,
        gpsHeading: currentLocation.coords.heading || 0,
        // Timestamp Information
        dateTimeOriginal: captureTimestamp,
        dateTimeDigitized: captureTimestamp,
        createDate: captureTimestamp,
        // Capture Information
        captureMode: 'CAMERA_ONLY',
        source: 'LoanSetu Mobile App',
        // Image Information
        imageWidth: photo.width,
        imageHeight: photo.height,
        orientation: 1, // Normal orientation
      };
      
      console.log('[CAPTURE] Photo taken with full EXIF:', {
        uri: photo.uri,
        size: fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0,
        device: `${deviceManufacturer} ${deviceModel}`,
        os: osVersion,
        gps: {
          lat: currentLocation.coords.latitude,
          lng: currentLocation.coords.longitude,
          accuracy: currentLocation.coords.accuracy,
          altitude: currentLocation.coords.altitude,
        },
        timestamp: captureTimestamp,
        exif: exifMetadata,
      });
      
      // Create media object with full GPS metadata and EXIF
      const mediaType = photoType === 'invoice' ? 'DOCUMENT' : 'IMAGE';
      const media: LocalMedia = {
        localId: uuid.v4() as string,
        type: mediaType,
        photoType: photoType === 'invoice' ? undefined : (photoType || 'general'),
        localPath: photo.uri,
        mimeType: 'image/jpeg',
        sizeInBytes: fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0,
        gpsLat: currentLocation.coords.latitude,
        gpsLng: currentLocation.coords.longitude,
        gpsAccuracy: currentLocation.coords.accuracy || undefined,
        capturedAt: captureTimestamp,
        width: photo.width,
        height: photo.height,
        isMockLocation: false, // TODO: Implement mock location detection
        // Store EXIF metadata as JSON string for later backend processing
        metadata: JSON.stringify(exifMetadata),
      };

      // Add to submission
      await addMedia(media);

      // Callback
      if (onCaptured) {
        onCaptured(media);
      }

      // Navigate back without clearing navigation state
      Alert.alert('Success', 'Photo captured successfully', [
        { text: 'OK', onPress: () => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/submission-screen');
          }
        }},
      ]);
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  const startRecording = async () => {
    if (!cameraRef.current || isRecording) return;

    try {
      // Request audio recording permission
      const audioPermission = await Audio.requestPermissionsAsync();
      if (!audioPermission.granted) {
        Alert.alert(
          'Permission Required',
          'Audio recording permission is required to record videos with sound.',
          [{ text: 'OK' }]
        );
        return;
      }

      setIsRecording(true);
      setRecordingDuration(0);
      recordingStartTimeRef.current = Date.now();

      // Start the duration timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // Start recording (this is async and waits until stopRecording is called)
      console.log('Starting video recording...');
      
      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      
      const video = await cameraRef.current.recordAsync({
        maxDuration: 60, // Max 60 seconds
      });

      console.log('Recording completed, video:', video);

      // Calculate actual recording duration
      const actualDuration = recordingStartTimeRef.current 
        ? Math.floor((Date.now() - recordingStartTimeRef.current) / 1000)
        : 0;
      console.log(`Actual recording duration: ${actualDuration} seconds`);

      // Clear the timer when recording stops
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      if (!video || !video.uri) {
        console.error('No video data received');
        setIsRecording(false);
        Alert.alert('Error', 'No video data was recorded. Please try again.');
        return;
      }

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(video.uri);

      // Create media object
      const media: LocalMedia = {
        localId: uuid.v4() as string,
        type: 'VIDEO',
        localPath: video.uri,
        mimeType: 'video/mp4',
        sizeInBytes: fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0,
        gpsLat: submissionState.currentLocation?.latitude,
        gpsLng: submissionState.currentLocation?.longitude,
        gpsAccuracy: submissionState.currentLocation?.accuracy,
        capturedAt: new Date().toISOString(),
        duration: actualDuration,
        isMockLocation: submissionState.currentLocation?.isMockLocation,
      };

      // Add to submission
      await addMedia(media);

      // Callback
      if (onCaptured) {
        onCaptured(media);
      }

      setIsRecording(false);

      // Navigate back without clearing navigation state
      Alert.alert('Success', 'Video recorded successfully', [
        { text: 'OK', onPress: () => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/submission-screen');
          }
        }},
      ]);
    } catch (error: any) {
      console.error('Error recording video:', error);
      console.error('Error details:', error.message, error.code);
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      const errorMessage = error.message || 'Failed to record video. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  const stopRecording = () => {
    if (!cameraRef.current || !isRecording) {
      console.log('Cannot stop: camera not ready or not recording');
      return;
    }

    // Ensure minimum recording duration of 1 second
    if (recordingDuration < 1) {
      Alert.alert('Too Short', 'Please record for at least 1 second');
      return;
    }

    try {
      console.log('Stopping recording after', recordingDuration, 'seconds');
      // Stop the camera recording
      cameraRef.current.stopRecording();
      console.log('Stop recording called successfully');
      // Timer will be cleared when recordAsync completes
    } catch (error: any) {
      console.error('Error stopping recording:', error);
      console.error('Stop error details:', error.message);
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  // Show loading screen while GPS initializes
  if (isLoadingLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Acquiring GPS signal...</Text>
        <Text style={styles.loadingSubtext}>Please ensure location services are enabled</Text>
      </View>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <CameraView 
        ref={cameraRef} 
        style={styles.camera} 
        facing={facing}
        mode={mode === 'VIDEO' ? 'video' : 'picture'}
        videoQuality="720p"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Ionicons name="close" size={32} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            {label && <Text style={styles.label}>{label}</Text>}
          </View>
          <View style={styles.headerRight} />
        </View>

        {/* GPS Status Indicator */}
        {currentLocation && (
          <View style={[
            styles.gpsStatus,
            locationAccuracy && locationAccuracy > 50 && locationAccuracy <= 100 ? styles.gpsStatusWarning : null,
            locationAccuracy && locationAccuracy > 100 ? styles.gpsStatusError : null
          ]}>
            <Ionicons 
              name="location" 
              size={16} 
              color={
                locationAccuracy && locationAccuracy > 100 ? '#FF3B30' :
                locationAccuracy && locationAccuracy > 50 ? '#FF9500' :
                '#34C759'
              } 
            />
            <Text style={styles.gpsStatusText}>
              {locationAccuracy 
                ? `GPS: ±${locationAccuracy.toFixed(0)}m`
                : 'GPS Active'
              }
            </Text>
            <Text style={styles.gpsCoords}>
              {currentLocation.coords.latitude.toFixed(6)}, {currentLocation.coords.longitude.toFixed(6)}
            </Text>
          </View>
        )}

        {/* Recording Timer */}
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingTime}>{formatTime(recordingDuration)}</Text>
          </View>
        )}

        {/* Footer Controls */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
            <Ionicons name="camera-reverse" size={32} color="#FFF" />
          </TouchableOpacity>

          {mode === 'PHOTO' ? (
            <TouchableOpacity style={styles.captureButton} onPress={capturePhoto}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.captureButton, isRecording && styles.captureButtonRecording]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <View style={[
                styles.captureButtonInner,
                isRecording && styles.captureButtonInnerRecording
              ]} />
            </TouchableOpacity>
          )}

          <View style={styles.flipButton} />
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 24,
  },
  loadingText: {
    fontSize: 18,
    color: '#FFF',
    marginTop: 16,
    fontWeight: '600',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 24,
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 16,
  },
  closeButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 48,
  },
  label: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  gpsStatus: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 199, 89, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    maxWidth: '90%',
  },
  gpsStatusWarning: {
    backgroundColor: 'rgba(255, 149, 0, 0.9)',
  },
  gpsStatusError: {
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
  },
  gpsStatusText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  gpsCoords: {
    color: '#FFF',
    fontSize: 11,
    marginTop: 2,
    opacity: 0.9,
  },
  recordingIndicator: {
    position: 'absolute',
    top: 140,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
    marginRight: 8,
  },
  recordingTime: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  flipButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonRecording: {
    backgroundColor: 'rgba(255, 59, 48, 0.5)',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF',
  },
  captureButtonInnerRecording: {
    borderRadius: 8,
    width: 32,
    height: 32,
  },
});
