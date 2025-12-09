// apps/mobileapp/components/submission/GpsSection.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';
import { useGpsWatcher } from '../../hooks/useGpsWatcher';
import { GpsRules } from '../../types/rules';
import { getTranslation } from '../../utils/translations';

interface GpsSectionProps {
  rules: GpsRules;
  expectedLocation?: {
    address?: string;
    latitude?: number;
    longitude?: number;
  };
}

export function GpsSection({ rules, expectedLocation }: GpsSectionProps) {
  const { currentLanguage } = useLanguage();
  const gpsState = useGpsWatcher(
    expectedLocation?.latitude && expectedLocation?.longitude
      ? { latitude: expectedLocation.latitude, longitude: expectedLocation.longitude }
      : undefined
  );

  const { location, distanceFromExpected } = gpsState;

  const isWithinRange = distanceFromExpected !== null && distanceFromExpected <= rules.max_distance_km;
  const hasLocation = location !== null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {rules.label || getTranslation('location', currentLanguage.code)}
        </Text>
        {hasLocation ? (
          <Ionicons
            name={isWithinRange ? 'checkmark-circle' : 'alert-circle'}
            size={24}
            color={isWithinRange ? '#059669' : '#DC2626'}
          />
        ) : (
          <ActivityIndicator size="small" color="#FC8019" />
        )}
      </View>

      {/* Expected Location */}
      {expectedLocation && (
        <View style={styles.locationBox}>
          <Text style={styles.locationLabel}>
            {getTranslation('expectedLocation', currentLanguage.code)}
          </Text>
          {expectedLocation.address && (
            <Text style={styles.locationText}>{expectedLocation.address}</Text>
          )}
          {expectedLocation.latitude && expectedLocation.longitude && (
            <Text style={styles.coordsText}>
              {expectedLocation.latitude.toFixed(6)}, {expectedLocation.longitude.toFixed(6)}
            </Text>
          )}
        </View>
      )}

      {/* Current Location */}
      <View style={styles.locationBox}>
        <Text style={styles.locationLabel}>
          {getTranslation('currentLocation', currentLanguage.code)}
        </Text>
        {hasLocation ? (
          <>
            <Text style={styles.coordsText}>
              {location!.latitude.toFixed(6)},{' '}
              {location!.longitude.toFixed(6)}
            </Text>
            <Text style={styles.accuracyText}>
              {getTranslation('accuracy', currentLanguage.code)}: ±{location!.accuracy.toFixed(0)}m
            </Text>
            {location!.isMockLocation && (
              <View style={styles.warningBox}>
                <Ionicons name="warning" size={16} color="#FF9500" />
                <Text style={styles.warningText}>
                  {getTranslation('mockLocationDetected', currentLanguage.code)}
                </Text>
              </View>
            )}
          </>
        ) : (
          <Text style={styles.loadingText}>
            {getTranslation('acquiringGpsLocation', currentLanguage.code)}
          </Text>
        )}
      </View>

      {/* Distance Check */}
      {distanceFromExpected !== null && expectedLocation && (
        <View
          style={[
            styles.distanceBox,
            isWithinRange ? styles.distanceBoxSuccess : styles.distanceBoxError,
          ]}
        >
          <View style={styles.distanceRow}>
            <Ionicons
              name={isWithinRange ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={isWithinRange ? '#059669' : '#DC2626'}
            />
            <Text
              style={[
                styles.distanceText,
                isWithinRange ? styles.distanceTextSuccess : styles.distanceTextError,
              ]}
            >
              {getTranslation('distance', currentLanguage.code)}: {distanceFromExpected.toFixed(2)} km
            </Text>
          </View>
          <Text
            style={[
              styles.distanceSubtext,
              isWithinRange ? styles.distanceTextSuccess : styles.distanceTextError,
            ]}
          >
            {isWithinRange
              ? `${getTranslation('withinAllowedRadius', currentLanguage.code)} ${rules.max_distance_km} km`
              : `${getTranslation('exceedsAllowedRadius', currentLanguage.code)} ${rules.max_distance_km} km`}
          </Text>
        </View>
      )}

      {/* Info box */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={16} color="#FC8019" />
        <Text style={styles.infoText}>
          {rules.description || 'Your location is automatically captured with each photo and video. GPS must remain enabled.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  locationBox: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  locationLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  coordsText: {
    fontSize: 13,
    color: '#555',
    fontFamily: 'monospace',
  },
  accuracyText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  loadingText: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FFF3CD',
    borderRadius: 6,
  },
  warningText: {
    fontSize: 12,
    color: '#FF9500',
    marginLeft: 6,
    fontWeight: '500',
  },
  distanceBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  distanceBoxSuccess: {
    backgroundColor: '#D1F2EB',
  },
  distanceBoxError: {
    backgroundColor: '#F8D7DA',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  distanceText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  distanceTextSuccess: {
    color: '#059669',
  },
  distanceTextError: {
    color: '#DC2626',
  },
  distanceSubtext: {
    fontSize: 13,
    marginLeft: 28,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
});
