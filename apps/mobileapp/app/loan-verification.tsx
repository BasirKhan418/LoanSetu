// apps/mobileapp/app/loan-verification.tsx
import { useDatabase } from '@/contexts/DatabaseContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from '@/contexts/LocationContext';
import { beneficiaryService } from '@/services/beneficiaryService';
import { getTranslation } from '@/utils/translations';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { Camera, CheckCircle, ChevronLeft, FileText, Info, MapPin, Wifi, WifiOff } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { submissionService } from '../services/submissionService';

const { width } = Dimensions.get('window');
const scale = width / 375;

type PhotoAngle = 'front' | 'back' | 'left' | 'right';
type CaptureType = PhotoAngle | 'invoice';

interface Photo {
  id: string;
  type: PhotoAngle;
  uri: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

interface InvoicePhoto {
  uri: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export default function LoanVerificationScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { isOnline, isInitialized } = useDatabase();
  const { hasSetLocation, showLocationPopup } = useLocation();
  const { currentLanguage } = useLanguage();
  
  const [productName, setProductName] = useState('');
  const [productDetails, setProductDetails] = useState('');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number; timestamp: string } | null>(null);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentCaptureType, setCurrentCaptureType] = useState<CaptureType | null>(null);
  const [invoicePhoto, setInvoicePhoto] = useState<InvoicePhoto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  
  
  const tabBarHeight = Platform.OS === 'ios' 
    ? Math.max(80, 50 + insets.bottom) 
    : Math.max(70, 60 + insets.bottom);

  const loanData = {
    id: params.loanId || '1',
    schemeName: params.schemeName || 'Farm Mechanization Support Scheme',
    amount: params.amount || '₹2,50,000',
    referenceId: params.referenceId || '#SBI-AGRI-2023-8845',
  };

  const photoTypes: PhotoAngle[] = ['front', 'back', 'left', 'right'];


  const handleCapturePhoto = async (type: PhotoAngle) => {
    try {
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== 'granted') {
        Alert.alert('Permission Required', 'Location access is required to geo-tag photos for verification.');
        return;
      }

      if (!cameraPermission?.granted) {
        const { granted } = await requestCameraPermission();
        if (!granted) {
          Alert.alert('Permission Required', 'Camera access is required to capture product photos.');
          return;
        }
      }

      setCurrentCaptureType(type);
      setIsCameraOpen(true);
      
      const locationInterval = setInterval(async () => {
        try {
          const location = await Location.getCurrentPositionAsync({});
          setCurrentLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: new Date().toLocaleString()
          });
        } catch (err) {
          console.log('Location update error:', err);
        }
      }, 1000);
      
      (global as any).locationInterval = locationInterval;
    } catch {
      Alert.alert('Error', 'Failed to access camera or location. Please check permissions.');
    }
  };

  const takePicture = async () => {
  if (!cameraRef || !currentCaptureType) return;

  try {
    setIsCapturing(true);

    // Get location fast: first try last known, then fallback
    let location = await Location.getLastKnownPositionAsync();
    if (!location) {
      location = await Location.getCurrentPositionAsync({});
    }

    const photo = await cameraRef.takePictureAsync({
      quality: 0.8,
      base64: false,
      skipProcessing: true,
    });

    const baseData = {
      uri: photo.uri,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: new Date().toISOString(),
    };

    if (currentCaptureType === 'invoice') {
      // ✅ Invoice flow
      setInvoicePhoto(baseData);
    } else {
      // ✅ 4-angle product photos
      const newPhoto: Photo = {
        id: Date.now().toString(),
        type: currentCaptureType,
        ...baseData,
      };

      setPhotos(prev => [
        ...prev.filter(p => p.type !== currentCaptureType),
        newPhoto,
      ]);
    }

    setCapturedPhotoUri(photo.uri);

    if ((global as any).locationInterval) {
      clearInterval((global as any).locationInterval);
      (global as any).locationInterval = null;
    }
  } catch (e) {
    console.log(e);
    Alert.alert('Error', 'Failed to capture photo. Please try again.');
  } finally {
    setIsCapturing(false);
  }
};


  const handleCaptureInvoice = async () => {
  try {
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    if (locationStatus !== 'granted') {
      Alert.alert('Permission Required', 'Location access is required to geo-tag photos.');
      return;
    }

    if (!cameraPermission?.granted) {
      const { granted } = await requestCameraPermission();
      if (!granted) {
        Alert.alert('Permission Required', 'Camera access is required to capture invoice.');
        return;
      }
    }

    setCurrentCaptureType('invoice');
    setIsCameraOpen(true);

    const locationInterval = setInterval(async () => {
      try {
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: new Date().toLocaleString(),
        });
      } catch (err) {
        console.log('Location update error:', err);
      }
    }, 1000);

    (global as any).locationInterval = locationInterval;
  } catch {
    Alert.alert('Error', 'Failed to access camera or location.');
  }
};


  const handleConfirmPhoto = () => {
    setCapturedPhotoUri(null);
    setIsCameraOpen(false);
    setCurrentCaptureType(null);
    setCurrentLocation(null);
    
    if ((global as any).locationInterval) {
      clearInterval((global as any).locationInterval);
      (global as any).locationInterval = null;
    }
  };

  const handleRetakePhoto = () => {
    setCapturedPhotoUri(null);
  };

  const handleSubmitVerification = async () => {
    if (!productName.trim()) {
      Alert.alert('Error', 'Please enter product name');
      return;
    }
    if (!productDetails.trim()) {
      Alert.alert('Error', 'Please enter product details');
      return;
    }
    if (photos.length < 4) {
      Alert.alert('Error', 'Please capture all 4 product photos');
      return;
    }
    if (!invoicePhoto) {
      Alert.alert('Error', 'Please upload invoice or ownership proof');
      return;
    }

    // Check if user has set their home/business location
    if (!hasSetLocation) {
      Alert.alert(
        'Location Required',
        'Please set your home/business location before submitting verification. This helps us prevent fraud and verify your application.',
        [
          {
            text: 'Set Location Now',
            onPress: () => showLocationPopup(),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
      return;
    }

    if (!isInitialized) {
      Alert.alert('Error', 'Database not ready. Please try again.');
      return;
    }

    const offlineMessage = !isOnline 
      ? '\n\n📱 You are offline. Your submission will be saved locally and synced automatically when you\'re back online.' 
      : '';

    Alert.alert(
      'Submit Verification',
      `Submit product details for bank verification?${offlineMessage}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              // Get or create beneficiary (mock data - replace with actual user data)
              const beneficiaryId = await beneficiaryService.saveBeneficiary({
                name: 'Current User', // Get from auth context
                mobileNumber: '1234567890', // Get from auth context
                schemeName: typeof loanData.schemeName === 'string' ? loanData.schemeName : loanData.schemeName?.[0],
              });

              // Get current location for submission
              const location = await Location.getCurrentPositionAsync({});

              // Create submission with all data
              const result = await submissionService.createSubmission({
                beneficiaryId,
                loanId: loanData.id as string,
                loanReferenceId: typeof loanData.referenceId === 'string' ? loanData.referenceId : loanData.referenceId?.[0],
                loanSchemeName: typeof loanData.schemeName === 'string' ? loanData.schemeName : loanData.schemeName?.[0],
                loanAmount: typeof loanData.amount === 'string' ? loanData.amount : loanData.amount?.[0],
                productName,
                productDetails,
                geoLat: location.coords.latitude,
                geoLng: location.coords.longitude,
                submittedBy: 'beneficiary',
                photos: photos.map(p => ({
                  type: p.type,
                  uri: p.uri,
                  latitude: p.latitude,
                  longitude: p.longitude,
                  timestamp: p.timestamp,
                })),
                invoicePhoto: {
                  uri: invoicePhoto.uri,
                  latitude: invoicePhoto.latitude,
                  longitude: invoicePhoto.longitude,
                  timestamp: invoicePhoto.timestamp,
                },
              });

              console.log('Submission created:', result);

              const successMessage = isOnline
                ? 'Verification submitted successfully! Bank will review your documents.\n\nSubmission is being synced to the server.'
                : 'Verification saved locally! It will be automatically synced when you\'re back online.\n\nYou can track the sync status in the Submissions tab.';

              Alert.alert('Success', successMessage, [
                {
                  text: 'View Status',
                  onPress: () => {
                    router.replace('/submission-status');
                  },
                },
                {
                  text: 'OK',
                  onPress: () => {
                    router.back();
                  },
                },
              ]);
            } catch (error) {
              console.error('Submission error:', error);
              Alert.alert('Error', 'Failed to save submission. Please try again.');
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const getPhotoForType = (type: 'front' | 'back' | 'left' | 'right') => {
    return photos.find(p => p.type === type);
  };

  const getCompletionStatus = () => {
    const hasProductInfo = productName.trim() && productDetails.trim();
    const hasAllPhotos = photos.length === 4;
    const hasInvoice = !!invoicePhoto;
    return { hasProductInfo, hasAllPhotos, hasInvoice };
  };

  const { hasProductInfo, hasAllPhotos, hasInvoice } = getCompletionStatus();
  const canSubmit = hasProductInfo && hasAllPhotos && hasInvoice && !isSubmitting;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header with online/offline indicator */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color="#1F2937" strokeWidth={2.5} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{getTranslation('loanVerification', currentLanguage.code)}</Text>
            <View style={styles.headerSubtitleRow}>
              <Text style={styles.headerSubtitle}>{loanData.referenceId}</Text>
              <View style={[styles.onlineIndicator, !isOnline && styles.offlineIndicator]}>
                {isOnline ? (
                  <Wifi size={12} color="#10b981" strokeWidth={2} />
                ) : (
                  <WifiOff size={12} color="#ef4444" strokeWidth={2} />
                )}
                <Text style={[styles.onlineText, !isOnline && styles.offlineText]}>
                  {isOnline ? getTranslation('online', currentLanguage.code) : getTranslation('offline', currentLanguage.code)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Offline banner */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <WifiOff size={16} color="#ef4444" strokeWidth={2} />
          <Text style={styles.offlineBannerText}>
            {getTranslation('offlineBanner', currentLanguage.code)}
          </Text>
        </View>
      )}

      {/* Rest of the UI remains the same... */}
      <View style={styles.loanInfoCard}>
        <View style={styles.loanInfoHeader}>
          <Text style={styles.loanSchemeName}>{loanData.schemeName}</Text>
          <Text style={styles.loanAmount}>{loanData.amount}</Text>
        </View>
        <Text style={styles.loanInfoText}>
          {getTranslation('loanInfoText', currentLanguage.code)}
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 100 }}
      >
        {/* Product Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{getTranslation('productInformation', currentLanguage.code)}</Text>
            {hasProductInfo && (
              <CheckCircle size={20} color="#10b981" strokeWidth={2} />
            )}
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>{getTranslation('productName', currentLanguage.code)} *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Mahindra 575 DI Tractor"
              placeholderTextColor="#9CA3AF"
              value={productName}
              onChangeText={setProductName}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>{getTranslation('productDetails', currentLanguage.code)} *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter model number, specifications, purchase date, dealer name..."
              placeholderTextColor="#9CA3AF"
              value={productDetails}
              onChangeText={setProductDetails}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Product Photos Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{getTranslation('productPhotos', currentLanguage.code)}</Text>
            {hasAllPhotos && (
              <CheckCircle size={20} color="#10b981" strokeWidth={2} />
            )}
          </View>
          
          <View style={styles.sectionDescriptionContainer}>
            <Camera size={16} color="#6B7280" strokeWidth={2} />
            <Text style={styles.sectionDescription}>
              {getTranslation('captureClearPhotosNote', currentLanguage.code)}
            </Text>
          </View>

          <View style={styles.photoGrid}>
            {photoTypes.map((type) => {
              const photo = getPhotoForType(type);
              const hasPhoto = !!photo;
              
              return (
                <TouchableOpacity
                  key={type}
                  style={styles.photoBox}
                  onPress={() => handleCapturePhoto(type)}
                  activeOpacity={0.7}
                >
                  {hasPhoto ? (
                    <View style={styles.photoPreview}>
                      <Image 
                        source={{ uri: photo.uri }} 
                        style={styles.photoImage}
                      />
                      <View style={styles.photoOverlay}>
                        <View style={styles.geoTag}>
                          <MapPin size={10} color="#FFFFFF" strokeWidth={2} />
                        </View>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Camera size={24} color="#FC8019" strokeWidth={2} />
                    </View>
                  )}
                  <Text style={[styles.photoLabel, hasPhoto && styles.photoLabelActive]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.infoBox}>
            <Info size={16} color="#FC8019" strokeWidth={2} />
            <Text style={styles.infoBoxText}>
              {getTranslation('cameraOnlyNote', currentLanguage.code)}
            </Text>
          </View>
        </View>

        {/* Invoice/Ownership Proof Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{getTranslation('invoiceOwnershipProof', currentLanguage.code)}</Text>
            {hasInvoice && (
              <CheckCircle size={20} color="#10b981" strokeWidth={2} />
            )}
          </View>
          
          <View style={styles.sectionDescriptionContainer}>
            <FileText size={16} color="#6B7280" strokeWidth={2} />
            <Text style={styles.sectionDescription}>
              {getTranslation('invoiceOwnershipProof', currentLanguage.code)}
            </Text>
          </View>

          {invoicePhoto ? (
            <View style={styles.invoicePreviewContainer}>
              <Image 
                source={{ uri: invoicePhoto.uri }} 
                style={styles.invoicePreview}
              />
              <TouchableOpacity
                style={styles.retakeInvoiceButton}
                onPress={handleCaptureInvoice}
                activeOpacity={0.7}
              >
                <Camera size={18} color="#FC8019" strokeWidth={2} />
                <Text style={styles.retakeInvoiceText}>{getTranslation('retake', currentLanguage.code)}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadInvoiceButton}
              onPress={handleCaptureInvoice}
              activeOpacity={0.7}
            >
              <Camera size={24} color="#FC8019" strokeWidth={2} />
              <Text style={styles.uploadInvoiceText}>{getTranslation('captureInvoice', currentLanguage.code)}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Requirements Checklist */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{getTranslation('verificationChecklist', currentLanguage.code)}</Text>
          
          <View style={styles.checklistItem}>
            <View style={[styles.checkbox, hasProductInfo && styles.checkboxChecked]}>
              {hasProductInfo && <CheckCircle size={16} color="#FFFFFF" strokeWidth={2.5} fill="#10b981" />}
            </View>
            <FileText size={18} color="#6B7280" strokeWidth={2} />
            <Text style={styles.checklistText}>{getTranslation('productInfoProvided', currentLanguage.code)}</Text>
          </View>

          <View style={styles.checklistItem}>
            <View style={[styles.checkbox, hasAllPhotos && styles.checkboxChecked]}>
              {hasAllPhotos && <CheckCircle size={16} color="#FFFFFF" strokeWidth={2.5} fill="#10b981" />}
            </View>
            <Camera size={18} color="#6B7280" strokeWidth={2} />
            <Text style={styles.checklistText}>{getTranslation('allPhotosCaptured', currentLanguage.code)}</Text>
          </View>

          <View style={styles.checklistItem}>
            <View style={[styles.checkbox, hasAllPhotos && styles.checkboxChecked]}>
              {hasAllPhotos && <CheckCircle size={16} color="#FFFFFF" strokeWidth={2.5} fill="#10b981" />}
            </View>
            <MapPin size={18} color="#6B7280" strokeWidth={2} />
            <Text style={styles.checklistText}>{getTranslation('photosGeoTagged', currentLanguage.code)}</Text>
          </View>

          <View style={styles.checklistItem}>
            <View style={[styles.checkbox, hasInvoice && styles.checkboxChecked]}>
              {hasInvoice && <CheckCircle size={16} color="#FFFFFF" strokeWidth={2.5} fill="#10b981" />}
            </View>
            <FileText size={18} color="#6B7280" strokeWidth={2} />
            <Text style={styles.checklistText}>{getTranslation('invoiceUploaded', currentLanguage.code)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Submit Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmitVerification}
          activeOpacity={0.8}
          disabled={!canSubmit}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>
              {canSubmit ? getTranslation('submitForVerification', currentLanguage.code) : getTranslation('completeAllRequirements', currentLanguage.code)}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Camera Modal - Same as before */}
{isCameraOpen && !capturedPhotoUri && (
  <View style={styles.cameraModal}>
    <CameraView
      style={StyleSheet.absoluteFill}
      ref={ref => setCameraRef(ref)}
      facing="back"
    />
    {/* Overlay on top of camera */}
    <View style={styles.cameraOverlay}>
      <View style={styles.cameraHeader}>
        <TouchableOpacity
          style={styles.cameraCloseButton}
          onPress={() => {
            setIsCameraOpen(false);
            setCurrentCaptureType(null);
            setCurrentLocation(null);
            if ((global as any).locationInterval) {
              clearInterval((global as any).locationInterval);
              (global as any).locationInterval = null;
            }
          }}
          activeOpacity={0.7}
        >
          <ChevronLeft size={28} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.cameraTitle}>
          {currentCaptureType === 'invoice'
            ? getTranslation('invoiceOwnershipProof', currentLanguage.code)
            : currentCaptureType
            ? `${currentCaptureType.charAt(0).toUpperCase()}${currentCaptureType.slice(1)} View`
            : getTranslation('capturePhoto', currentLanguage.code)}
        </Text>
      </View>

      {currentLocation && (
        <View style={styles.gpsInfoContainer}>
          <View style={styles.gpsInfoBox}>
            <MapPin size={14} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.gpsInfoText}>
              {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
            </Text>
          </View>
          <Text style={styles.gpsTimestamp}>{currentLocation.timestamp}</Text>
        </View>
      )}

      <View style={styles.cameraFooter}>
        <TouchableOpacity
          style={[styles.captureButton, isCapturing && { opacity: 0.6 }]}
          onPress={takePicture}
          activeOpacity={0.8}
          disabled={isCapturing}
        >
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>
        {isCapturing && <Text style={styles.capturingText}>{getTranslation('capturing', currentLanguage.code)}</Text>}
      </View>
    </View>
  </View>
)}

{/* Photo Preview */}
{isCameraOpen && capturedPhotoUri && (
  <View style={styles.cameraModal}>
    <Image source={{ uri: capturedPhotoUri }} style={styles.previewImage} />
    <View style={styles.previewOverlay}>
      <View style={styles.previewHeader}>
        <Text style={styles.previewTitle}>Photo Preview</Text>
      </View>
      <View style={styles.previewFooter}>
        <TouchableOpacity
          style={styles.retakeButton}
          onPress={handleRetakePhoto}
          activeOpacity={0.8}
        >
          <Text style={styles.retakeButtonText}>{getTranslation('retake', currentLanguage.code)}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirmPhoto}
          activeOpacity={0.8}
        >
          <Text style={styles.confirmButtonText}>{getTranslation('usePhoto', currentLanguage.code)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
)}

    </View>
  );
}

// Styles - Add new styles for online/offline indicators
const styles = StyleSheet.create({
  // ... (keep all existing styles)
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Math.max(20, scale * 22),
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerSubtitle: {
    fontSize: Math.max(13, scale * 14),
    color: '#6B7280',
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
  },
  offlineIndicator: {
    backgroundColor: '#FEE2E2',
  },
  onlineText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10b981',
  },
  offlineText: {
    color: '#ef4444',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FEE2E2',
  },
  offlineBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#991b1b',
    lineHeight: 18,
  },
  // ... (include all other existing styles from the original component)
  // I'll include a few key ones for reference:
  loanInfoCard: {
    backgroundColor: '#FAFAFA',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loanInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  capturingText: {
  marginTop: 8,
  color: '#FFFFFF',
  fontSize: Math.max(12, scale * 13),
},
  loanSchemeName: {
    flex: 1,
    fontSize: Math.max(15, scale * 16),
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 12,
  },
  loanAmount: {
    fontSize: Math.max(18, scale * 20),
    fontWeight: 'bold',
    color: '#FC8019',
  },
  loanInfoText: {
    fontSize: Math.max(13, scale * 14),
    color: '#6B7280',
    lineHeight: 18,
  },
  scrollContent: {
    flex: 1,
  },
  section: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: Math.max(16, scale * 17),
    fontWeight: '700',
    color: '#1F2937',
  },
  sectionDescriptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionDescription: {
    flex: 1,
    fontSize: Math.max(13, scale * 14),
    color: '#6B7280',
    lineHeight: 18,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: Math.max(13, scale * 14),
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: Math.max(15, scale * 16),
    color: '#1F2937',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  // Add these remaining styles to the StyleSheet in loan-verification.tsx

  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 16,
  },
  photoBox: {
    width: '50%',
    padding: 4,
  },
  photoPlaceholder: {
    aspectRatio: 1,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FFE5D0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  photoPreview: {
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  photoOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  geoTag: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoLabel: {
    fontSize: Math.max(12, scale * 13),
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  photoLabelActive: {
    color: '#059669',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF8F5',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FFE5D0',
  },
  infoBoxText: {
    flex: 1,
    fontSize: Math.max(12, scale * 13),
    color: '#4B5563',
    lineHeight: 18,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    borderColor: '#10b981',
    backgroundColor: '#10b981',
  },
  checklistText: {
    flex: 1,
    fontSize: Math.max(14, scale * 15),
    color: '#4B5563',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  submitButton: {
    backgroundColor: '#FC8019',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#FC8019',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    fontSize: Math.max(16, scale * 17),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Camera Modal Styles
  cameraModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 1000,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
  ...StyleSheet.absoluteFillObject,
  justifyContent: 'space-between',
},
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  cameraCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cameraTitle: {
    fontSize: Math.max(18, scale * 20),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cameraFooter: {
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 60 : 40,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FC8019',
  },
  // GPS Info Styles
  gpsInfoContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 100,
    left: 20,
    right: 20,
  },
  gpsInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    alignSelf: 'flex-start',
  },
  gpsInfoText: {
    color: '#FFFFFF',
    fontSize: Math.max(12, scale * 13),
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  gpsTimestamp: {
    color: '#FFFFFF',
    fontSize: Math.max(10, scale * 11),
    marginTop: 4,
    opacity: 0.8,
  },
  // Preview Styles
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  previewHeader: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  previewTitle: {
    fontSize: Math.max(18, scale * 20),
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  previewFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 60 : 40,
    gap: 12,
  },
  retakeButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  retakeButtonText: {
    color: '#FFFFFF',
    fontSize: Math.max(16, scale * 17),
    fontWeight: '700',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#FC8019',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: Math.max(16, scale * 17),
    fontWeight: '700',
  },
  // Invoice Upload Styles
  uploadInvoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8F5',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFE5D0',
    borderStyle: 'dashed',
    gap: 12,
  },
  uploadInvoiceText: {
    fontSize: Math.max(15, scale * 16),
    fontWeight: '600',
    color: '#FC8019',
  },
  invoicePreviewContainer: {
    position: 'relative',
  },
  invoicePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  retakeInvoiceButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  retakeInvoiceText: {
    fontSize: Math.max(13, scale * 14),
    fontWeight: '600',
    color: '#FC8019',
  }
});