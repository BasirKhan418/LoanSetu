// apps/mobileapp/components/submission/MediaSection.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { AlertCircle, Camera, CheckCircle, Info, Video, X } from 'lucide-react-native';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DESIGN_SYSTEM } from '../../constants/designSystem';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSubmission } from '../../contexts/SubmissionContext';
import { MediaRequirements } from '../../types/rules';
import { getTranslation } from '../../utils/translations';
import { useCustomAlert } from '../CustomAlert';

interface MediaSectionProps {
  rules: MediaRequirements;
}

export function MediaSection({ rules }: MediaSectionProps) {
  const { submissionState, removeMedia } = useSubmission();
  const { showAlert } = useCustomAlert();
  const { currentLanguage } = useLanguage();

  const photos = submissionState.media.filter((m) => m.type === 'IMAGE');
  const videos = submissionState.media.filter((m) => m.type === 'VIDEO');
  const totalVideoSeconds = videos.reduce((sum, v) => sum + (v.duration || 0), 0);

  // Check if photos or videos are required
  const photosRequired = rules.min_photos > 0;
  const videosRequired = rules.min_video_seconds > 0;
  
  // If neither photos nor videos are required, don't render the section
  if (!photosRequired && !videosRequired) {
    return null;
  }

  const photosNeeded = rules.min_photos - photos.length;
  const videoSecondsNeeded = Math.max(0, rules.min_video_seconds - totalVideoSeconds);

  // Require EXACT count, not minimum
  const photosComplete = photos.length === rules.min_photos;
  const videosComplete = totalVideoSeconds >= rules.min_video_seconds;

  const handleRemoveMedia = (localId: string) => {
    showAlert(
      'warning',
      getTranslation('removeMedia', currentLanguage.code),
      getTranslation('areYouSureRemoveMedia', currentLanguage.code),
      [
        { text: getTranslation('cancel', currentLanguage.code), style: 'cancel' },
        {
          text: getTranslation('remove', currentLanguage.code),
          style: 'destructive',
          onPress: () => removeMedia(localId),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Camera size={24} color={DESIGN_SYSTEM.colors.primary} strokeWidth={2.5} />
        <View style={styles.headerText}>
          <Text style={styles.title}>{rules.label || getTranslation('photosAndVideo', currentLanguage.code)}</Text>
          <Text style={styles.subtitle}>
            {rules.description || getTranslation('captureClearMedia', currentLanguage.code)}
          </Text>
        </View>
      </View>

      {photosRequired && (
        <View style={styles.subsection}>
          <View style={styles.subsectionHeader}>
            <Text style={styles.subsectionTitle}>{rules.photo_label || `${getTranslation('photos', currentLanguage.code)}`}</Text>
            <View style={[styles.statusBadge, photosComplete ? styles.statusSuccess : styles.statusPending]}>
              {photosComplete ? (
                <CheckCircle size={14} color={DESIGN_SYSTEM.colors.success} strokeWidth={2.5} />
              ) : (
                <AlertCircle size={14} color={DESIGN_SYSTEM.colors.warning} strokeWidth={2.5} />
              )}
              <Text style={[styles.statusText, photosComplete ? styles.statusSuccessText : styles.statusPendingText]}>
                {photos.length} / {rules.min_photos}
              </Text>
            </View>
          </View>

          {photosNeeded !== 0 && (
            <View style={styles.warningBox}>
              <AlertCircle size={16} color={DESIGN_SYSTEM.colors.warning} strokeWidth={2} />
              <Text style={styles.warningText}>
                {photosNeeded > 0 ? `${photosNeeded} ${getTranslation(photosNeeded > 1 ? 'morePhotosRequired' : 'morePhotoRequired', currentLanguage.code)}` : `${getTranslation('removePhoto', currentLanguage.code)} ${Math.abs(photosNeeded)} photo${Math.abs(photosNeeded) > 1 ? 's' : ''} (exactly ${rules.min_photos} needed)`}
              </Text>
            </View>
          )}

          {photos.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaGrid}>
              {photos.map((photo) => (
                <View key={photo.localId} style={styles.mediaThumbnail}>
                  <Image source={{ uri: photo.localPath }} style={styles.thumbnailImage} />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.6)']}
                    style={styles.thumbnailOverlay}
                  />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveMedia(photo.localId)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.removeButtonInner}>
                      <X size={16} color={DESIGN_SYSTEM.colors.white} strokeWidth={3} />
                    </View>
                  </TouchableOpacity>
                  {photo.photoType && (
                    <View style={styles.photoTypeBadge}>
                      <Text style={styles.photoTypeText}>{photo.photoType.toUpperCase()}</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity
            style={styles.captureButton}
            onPress={() => {
              router.push({
                pathname: '/camera-screen',
                params: { mode: 'PHOTO', label: 'Capture Asset Photo' }
              });
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[DESIGN_SYSTEM.colors.primary, DESIGN_SYSTEM.colors.primaryDark]}
              style={styles.captureButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Camera size={20} color={DESIGN_SYSTEM.colors.white} strokeWidth={2.5} />
              <Text style={styles.captureButtonText}>{getTranslation('capturePhoto', currentLanguage.code)}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Video Section - Only show if video is required */}
      {videosRequired && (
        <View style={styles.subsection}>
          <View style={styles.subsectionHeader}>
            <Text style={styles.subsectionTitle}>{rules.video_label || `${getTranslation('video', currentLanguage.code)}`}</Text>
            <View style={[styles.statusBadge, videosComplete ? styles.statusSuccess : styles.statusPending]}>
              {videosComplete ? (
                <CheckCircle size={14} color={DESIGN_SYSTEM.colors.success} strokeWidth={2.5} />
              ) : (
                <AlertCircle size={14} color={DESIGN_SYSTEM.colors.warning} strokeWidth={2.5} />
              )}
              <Text style={[styles.statusText, videosComplete ? styles.statusSuccessText : styles.statusPendingText]}>
                {Math.floor(totalVideoSeconds)}s / {rules.min_video_seconds}s
              </Text>
            </View>
          </View>

          {videoSecondsNeeded > 0 && (
            <View style={styles.warningBox}>
              <AlertCircle size={16} color={DESIGN_SYSTEM.colors.warning} strokeWidth={2} />
              <Text style={styles.warningText}>
                {videoSecondsNeeded} {getTranslation(videoSecondsNeeded > 1 ? 'moreSecondsRequired' : 'moreSecondRequired', currentLanguage.code)}
              </Text>
            </View>
          )}

          {videos.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaGrid}>
              {videos.map((video) => (
                <View key={video.localId} style={styles.mediaThumbnail}>
                  <View style={styles.videoPlaceholder}>
                    <Video size={40} color={DESIGN_SYSTEM.colors.white} strokeWidth={2} />
                    <View style={styles.videoDurationBadge}>
                      <Text style={styles.videoDuration}>{Math.floor(video.duration || 0)}s</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveMedia(video.localId)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.removeButtonInner}>
                      <X size={16} color={DESIGN_SYSTEM.colors.white} strokeWidth={3} />
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity
            style={styles.captureButton}
            onPress={() => {
              router.push({
                pathname: '/camera-screen',
                params: { mode: 'VIDEO', label: 'Record Asset Video' }
              });
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[DESIGN_SYSTEM.colors.primary, DESIGN_SYSTEM.colors.primaryDark]}
              style={styles.captureButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Video size={20} color={DESIGN_SYSTEM.colors.white} strokeWidth={2.5} />
              <Text style={styles.captureButtonText}>{getTranslation('recordVideo', currentLanguage.code)}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Info Box */}
      <View style={styles.infoBox}>
        <View style={styles.infoIconContainer}>
          <Info size={18} color="#6B7280" strokeWidth={2.5} />
        </View>
        <Text style={styles.infoText}>
          {getTranslation('allMediaCameraOnly', currentLanguage.code)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...DESIGN_SYSTEM.components.card,
    marginBottom: DESIGN_SYSTEM.spacing.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DESIGN_SYSTEM.spacing.md,
    marginBottom: DESIGN_SYSTEM.spacing.base,
    paddingBottom: DESIGN_SYSTEM.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN_SYSTEM.colors.gray100,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: DESIGN_SYSTEM.typography.fontSize.lg,
    fontWeight: DESIGN_SYSTEM.typography.fontWeight.bold,
    color: DESIGN_SYSTEM.colors.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: DESIGN_SYSTEM.typography.fontSize.sm,
    color: DESIGN_SYSTEM.colors.textSecondary,
    lineHeight: 18,
  },
  subsection: {
    marginBottom: DESIGN_SYSTEM.spacing.lg,
  },
  subsectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DESIGN_SYSTEM.spacing.md,
  },
  subsectionTitle: {
    fontSize: DESIGN_SYSTEM.typography.fontSize.base,
    fontWeight: DESIGN_SYSTEM.typography.fontWeight.semibold,
    color: DESIGN_SYSTEM.colors.textPrimary,
  },
  statusBadge: {
    ...DESIGN_SYSTEM.components.badge,
  },
  statusSuccess: {
    backgroundColor: DESIGN_SYSTEM.colors.successLight,
  },
  statusPending: {
    backgroundColor: DESIGN_SYSTEM.colors.warningLight,
  },
  statusText: {
    fontSize: DESIGN_SYSTEM.typography.fontSize.xs,
    fontWeight: DESIGN_SYSTEM.typography.fontWeight.semibold,
  },
  statusSuccessText: {
    color: DESIGN_SYSTEM.colors.success,
  },
  statusPendingText: {
    color: DESIGN_SYSTEM.colors.warning,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DESIGN_SYSTEM.spacing.sm,
    backgroundColor: DESIGN_SYSTEM.colors.warningLight,
    padding: DESIGN_SYSTEM.spacing.md,
    borderRadius: DESIGN_SYSTEM.borderRadius.md,
    marginBottom: DESIGN_SYSTEM.spacing.md,
  },
  warningText: {
    flex: 1,
    fontSize: DESIGN_SYSTEM.typography.fontSize.sm,
    color: DESIGN_SYSTEM.colors.warning,
    fontWeight: DESIGN_SYSTEM.typography.fontWeight.medium,
  },
  mediaGrid: {
    marginBottom: DESIGN_SYSTEM.spacing.md,
    paddingVertical: DESIGN_SYSTEM.spacing.xs,
  },
  mediaThumbnail: {
    width: 110,
    height: 110,
    marginRight: DESIGN_SYSTEM.spacing.md,
    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    ...DESIGN_SYSTEM.shadows.base,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    backgroundColor: DESIGN_SYSTEM.colors.gray100,
  },
  thumbnailOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: DESIGN_SYSTEM.colors.gray800,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoDurationBadge: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  videoDuration: {
    color: DESIGN_SYSTEM.colors.white,
    fontSize: DESIGN_SYSTEM.typography.fontSize.xs,
    fontWeight: DESIGN_SYSTEM.typography.fontWeight.bold,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: DESIGN_SYSTEM.borderRadius.sm,
  },
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  removeButtonInner: {
    backgroundColor: DESIGN_SYSTEM.colors.error,
    borderRadius: DESIGN_SYSTEM.borderRadius.full,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...DESIGN_SYSTEM.shadows.md,
  },
  photoTypeBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: DESIGN_SYSTEM.borderRadius.sm,
  },
  photoTypeText: {
    color: DESIGN_SYSTEM.colors.white,
    fontSize: DESIGN_SYSTEM.typography.fontSize.xs,
    fontWeight: DESIGN_SYSTEM.typography.fontWeight.bold,
  },
  captureButton: {
    borderRadius: DESIGN_SYSTEM.borderRadius.md,
    overflow: 'hidden',
    ...DESIGN_SYSTEM.shadows.base,
  },
  captureButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DESIGN_SYSTEM.spacing.sm,
    paddingVertical: DESIGN_SYSTEM.spacing.md,
    paddingHorizontal: DESIGN_SYSTEM.spacing.lg,
  },
  captureButtonText: {
    fontSize: DESIGN_SYSTEM.typography.fontSize.base,
    fontWeight: DESIGN_SYSTEM.typography.fontWeight.semibold,
    color: DESIGN_SYSTEM.colors.white,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    padding: DESIGN_SYSTEM.spacing.md,
    borderRadius: DESIGN_SYSTEM.borderRadius.md,
    gap: DESIGN_SYSTEM.spacing.md,
  },
  infoIconContainer: {
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: DESIGN_SYSTEM.typography.fontSize.sm,
    color: '#6B7280',
    lineHeight: 20,
    fontWeight: DESIGN_SYSTEM.typography.fontWeight.medium,
  },
});
