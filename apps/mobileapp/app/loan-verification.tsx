import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { Camera, CheckCircle, ChevronLeft, FileText, Info, MapPin } from 'lucide-react-native';
import React, { useState } from 'react';
import {
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

const { width } = Dimensions.get('window');
const scale = width / 375;

interface Photo {
  id: string;
  type: 'front' | 'back' | 'left' | 'right';
  uri: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export default function LoanVerificationScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  
  const [productName, setProductName] = useState('');
  const [productDetails, setProductDetails] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [currentCaptureType, setCurrentCaptureType] = useState<'front' | 'back' | 'left' | 'right' | null>(null);
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number; timestamp: string } | null>(null);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [invoicePhoto, setInvoicePhoto] = useState<Photo | null>(null);
  
  const tabBarHeight = Platform.OS === 'ios' 
    ? Math.max(80, 50 + insets.bottom) 
    : Math.max(70, 60 + insets.bottom);

  // Mock loan data - in real app, fetch based on params.loanId
  const loanData = {
    id: params.loanId || '1',
    schemeName: params.schemeName || 'Farm Mechanization Support Scheme',
    amount: params.amount || '₹2,50,000',
    referenceId: '#SBI-AGRI-2023-8845',
  };

  // Photo types for capturing product images
  const photoTypes: ('front' | 'back' | 'left' | 'right')[] = ['front', 'back', 'left', 'right'];

  const handleCapturePhoto = async (type: 'front' | 'back' | 'left' | 'right') => {
    try {
      // Request location permission first
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== 'granted') {
        Alert.alert('Permission Required', 'Location access is required to geo-tag photos for verification.');
        return;
      }

      // Request camera permission
      if (!cameraPermission?.granted) {
        const { granted } = await requestCameraPermission();
        if (!granted) {
          Alert.alert('Permission Required', 'Camera access is required to capture product photos.');
          return;
        }
      }

      // Open camera and start location tracking
      setCurrentCaptureType(type);
      setIsCameraOpen(true);
      
      // Start watching location for live display
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
      
      // Store interval ID for cleanup
      (global as any).locationInterval = locationInterval;
    } catch {
      Alert.alert('Error', 'Failed to access camera or location. Please check permissions.');
    }
  };

  const takePicture = async () => {
    if (cameraRef && currentCaptureType) {
      try {
        // Get current location
        const location = await Location.getCurrentPositionAsync({});
        
        // Take photo
        const photo = await cameraRef.takePictureAsync({
          quality: 0.8,
          base64: false,
        });

        // Create photo object with geo-tagging
        const newPhoto: Photo = {
          id: Date.now().toString(),
          type: currentCaptureType,
          uri: photo.uri,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: new Date().toISOString()
        };

        // Check if this is for invoice or product photo
        const isInvoiceCapture = !photoTypes.includes(currentCaptureType as any);
        
        if (isInvoiceCapture) {
          // Set invoice photo
          setInvoicePhoto(newPhoto);
        } else {
          // Update product photos array
          setPhotos(prev => [...prev.filter(p => p.type !== currentCaptureType), newPhoto]);
        }
        
        // Show photo preview
        setCapturedPhotoUri(photo.uri);
        
        // Clear location tracking
        if ((global as any).locationInterval) {
          clearInterval((global as any).locationInterval);
          (global as any).locationInterval = null;
        }
      } catch {
        Alert.alert('Error', 'Failed to capture photo. Please try again.');
      }
    }
  };

  const handleCaptureInvoice = async () => {
    try {
      // Request location permission
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== 'granted') {
        Alert.alert('Permission Required', 'Location access is required to geo-tag photos.');
        return;
      }

      // Request camera permission
      if (!cameraPermission?.granted) {
        const { granted } = await requestCameraPermission();
        if (!granted) {
          Alert.alert('Permission Required', 'Camera access is required to capture invoice.');
          return;
        }
      }

      // Open camera for invoice
      setCurrentCaptureType('front');
      setIsCameraOpen(true);
      
      // Start location tracking
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

  const handleSubmitVerification = () => {
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

    Alert.alert(
      'Submit Verification',
      'Submit product details for bank verification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: () => {
            router.back();
            Alert.alert('Success', 'Verification submitted successfully! Bank will review your documents.');
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
  const canSubmit = hasProductInfo && hasAllPhotos && hasInvoice;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
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
            <Text style={styles.headerTitle}>Loan Verification</Text>
            <Text style={styles.headerSubtitle}>{loanData.referenceId}</Text>
          </View>
        </View>
      </View>

      {/* Loan Info Card */}
      <View style={styles.loanInfoCard}>
        <View style={styles.loanInfoHeader}>
          <Text style={styles.loanSchemeName}>{loanData.schemeName}</Text>
          <Text style={styles.loanAmount}>{loanData.amount}</Text>
        </View>
        <Text style={styles.loanInfoText}>
          Upload proof of purchase with product photos to receive loan disbursement
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
            <Text style={styles.sectionTitle}>Product Information</Text>
            {hasProductInfo && (
              <CheckCircle size={20} color="#10b981" strokeWidth={2} />
            )}
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Product Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Mahindra 575 DI Tractor"
              placeholderTextColor="#9CA3AF"
              value={productName}
              onChangeText={setProductName}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Product Details *</Text>
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
            <Text style={styles.sectionTitle}>Product Photos (4 Angles)</Text>
            {hasAllPhotos && (
              <CheckCircle size={20} color="#10b981" strokeWidth={2} />
            )}
          </View>
          
          <View style={styles.sectionDescriptionContainer}>
            <Camera size={16} color="#6B7280" strokeWidth={2} />
            <Text style={styles.sectionDescription}>
              Capture clear photos from all 4 angles. All photos will be geo-tagged automatically.
            </Text>
          </View>

          {/* Photo Grid - Compact 2x2 Layout */}
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
              Camera only - no gallery upload. Photos are automatically geo-tagged for authenticity.
            </Text>
          </View>
        </View>

        {/* Invoice/Ownership Proof Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Invoice / Ownership Proof</Text>
            {hasInvoice && (
              <CheckCircle size={20} color="#10b981" strokeWidth={2} />
            )}
          </View>
          
          <View style={styles.sectionDescriptionContainer}>
            <FileText size={16} color="#6B7280" strokeWidth={2} />
            <Text style={styles.sectionDescription}>
              Upload purchase invoice or ownership proof document for verification.
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
                <Text style={styles.retakeInvoiceText}>Retake</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadInvoiceButton}
              onPress={handleCaptureInvoice}
              activeOpacity={0.7}
            >
              <Camera size={24} color="#FC8019" strokeWidth={2} />
              <Text style={styles.uploadInvoiceText}>Capture Invoice</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Requirements Checklist */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verification Checklist</Text>
          
          <View style={styles.checklistItem}>
            <View style={[styles.checkbox, hasProductInfo && styles.checkboxChecked]}>
              {hasProductInfo && <CheckCircle size={16} color="#FFFFFF" strokeWidth={2.5} fill="#10b981" />}
            </View>
            <FileText size={18} color="#6B7280" strokeWidth={2} />
            <Text style={styles.checklistText}>Product information provided</Text>
          </View>

          <View style={styles.checklistItem}>
            <View style={[styles.checkbox, hasAllPhotos && styles.checkboxChecked]}>
              {hasAllPhotos && <CheckCircle size={16} color="#FFFFFF" strokeWidth={2.5} fill="#10b981" />}
            </View>
            <Camera size={18} color="#6B7280" strokeWidth={2} />
            <Text style={styles.checklistText}>All 4 product photos captured</Text>
          </View>

          <View style={styles.checklistItem}>
            <View style={[styles.checkbox, hasAllPhotos && styles.checkboxChecked]}>
              {hasAllPhotos && <CheckCircle size={16} color="#FFFFFF" strokeWidth={2.5} fill="#10b981" />}
            </View>
            <MapPin size={18} color="#6B7280" strokeWidth={2} />
            <Text style={styles.checklistText}>Photos geo-tagged with location</Text>
          </View>

          <View style={styles.checklistItem}>
            <View style={[styles.checkbox, hasInvoice && styles.checkboxChecked]}>
              {hasInvoice && <CheckCircle size={16} color="#FFFFFF" strokeWidth={2.5} fill="#10b981" />}
            </View>
            <FileText size={18} color="#6B7280" strokeWidth={2} />
            <Text style={styles.checklistText}>Invoice or ownership proof uploaded</Text>
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
          <Text style={styles.submitButtonText}>
            {canSubmit ? 'Submit for Verification' : 'Complete All Requirements'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Camera Modal */}
      {isCameraOpen && (
        <View style={styles.cameraModal}>
          <CameraView
            style={styles.camera}
            ref={(ref) => setCameraRef(ref)}
            facing="back"
          >
            <View style={styles.cameraOverlay}>
              {!capturedPhotoUri ? (
                <>
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
                      {currentCaptureType ? `${currentCaptureType.charAt(0).toUpperCase() + currentCaptureType.slice(1)} View` : 'Capture Photo'}
                    </Text>
                  </View>
                  
                  {/* Live GPS Info Display */}
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
                      style={styles.captureButton}
                      onPress={takePicture}
                      activeOpacity={0.8}
                    >
                      <View style={styles.captureButtonInner} />
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  {/* Photo Preview */}
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
                        <Text style={styles.retakeButtonText}>Retake</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={handleConfirmPhoto}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.confirmButtonText}>Use Photo</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
            </View>
          </CameraView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  headerSubtitle: {
    fontSize: Math.max(13, scale * 14),
    color: '#6B7280',
  },
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
    flex: 1,
    backgroundColor: 'transparent',
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
  },
});
