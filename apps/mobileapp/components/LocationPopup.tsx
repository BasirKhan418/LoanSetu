// apps/mobileapp/components/LocationPopup.tsx
import { useLocation } from '@/contexts/LocationContext';
import { MapPin } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');
const scale = width / 375;

export function LocationPopup() {
  const { isLocationPopupVisible, saveHomeLocation, dismissLocationPopup, getCurrentLocation } = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const handleGiveLocation = async () => {
    setIsLoading(true);
    try {
      const location = await getCurrentLocation();
      
      if (!location) {
        Alert.alert(
          'Permission Required',
          'Please enable location permissions to set your home/business location.'
        );
        setIsLoading(false);
        return;
      }

      await saveHomeLocation(location);
      
      Alert.alert(
        'Success',
        'Your home/business location has been saved successfully!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error saving location:', error);
      Alert.alert('Error', 'Failed to save location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLater = () => {
    dismissLocationPopup();
  };

  return (
    <Modal
      visible={isLocationPopupVisible}
      transparent
      animationType="fade"
      onRequestClose={handleLater}
    >
      <View style={styles.overlay}>
        <View style={styles.popup}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <MapPin size={48} color="#FC8019" strokeWidth={2} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Set Your Location</Text>

          {/* Description */}
          <Text style={styles.description}>
            Are you currently at your home or business location for which you are taking the loan?
          </Text>

          <Text style={styles.subDescription}>
            This helps us verify your application and prevent fraud.
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleGiveLocation}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <MapPin size={20} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.primaryButtonText}>Give Location</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleLater}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Later</Text>
            </TouchableOpacity>
          </View>

          {/* Info text */}
          <Text style={styles.infoText}>
            *You can set this location anytime from your profile
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  popup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF8F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FFE5D0',
  },
  title: {
    fontSize: Math.max(22, scale * 24),
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: Math.max(15, scale * 16),
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  subDescription: {
    fontSize: Math.max(13, scale * 14),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#FC8019',
    shadowColor: '#FC8019',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: Math.max(16, scale * 17),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    fontSize: Math.max(16, scale * 17),
    fontWeight: '600',
    color: '#6B7280',
  },
  infoText: {
    fontSize: Math.max(12, scale * 13),
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
});
