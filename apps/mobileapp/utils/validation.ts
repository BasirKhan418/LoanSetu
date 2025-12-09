// apps/mobileapp/utils/validation.ts
import { RuleSet, ValidationError, ValidationResult } from '../types/rules';
import { SubmissionState } from '../types/submission';

/**
 * Calculate distance between two GPS coordinates in kilometers
 * Uses Haversine formula
 */
export function calculateDistance(
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

/**
 * Calculate days between two dates
 */
export function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Validate submission against ruleset
 */
export function validateSubmission(
  ruleset: RuleSet,
  submissionState: SubmissionState
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const { rules } = ruleset;

  // Validate media requirements
  if (rules.media_requirements) {
    const { min_photos, min_video_seconds, allowed_mime_types } = rules.media_requirements;

    const photos = submissionState.media.filter((m) => m.type === 'IMAGE');
    const videos = submissionState.media.filter((m) => m.type === 'VIDEO');

    if (photos.length < min_photos) {
      errors.push({
        field: 'photos',
        message: `At least ${min_photos} photos are required. Currently: ${photos.length}`,
        severity: 'error',
      });
    }

    if (min_video_seconds > 0) {
      const totalVideoSeconds = videos.reduce((sum, v) => sum + (v.duration || 0), 0);
      if (totalVideoSeconds < min_video_seconds) {
        errors.push({
          field: 'video',
          message: `Video must be at least ${min_video_seconds} seconds. Currently: ${Math.floor(totalVideoSeconds)}s`,
          severity: 'error',
        });
      }
    }

    // Check mime types
    const invalidMedia = submissionState.media.filter(
      (m) => !allowed_mime_types.includes(m.mimeType)
    );
    if (invalidMedia.length > 0) {
      errors.push({
        field: 'media',
        message: `Some media files have invalid formats. Allowed: ${allowed_mime_types.join(', ')}`,
        severity: 'error',
      });
    }
  }

  // Validate GPS requirements
  if (rules.gps_rules) {
    const { max_distance_km, require_exif_gps } = rules.gps_rules;

    if (!submissionState.currentLocation) {
      errors.push({
        field: 'gps',
        message: 'GPS location is required but not available',
        severity: 'error',
      });
    } else if (submissionState.loanDetails?.expectedLocation) {
      const distance = calculateDistance(
        submissionState.currentLocation.latitude,
        submissionState.currentLocation.longitude,
        submissionState.loanDetails.expectedLocation.latitude!,
        submissionState.loanDetails.expectedLocation.longitude!
      );

      if (distance > max_distance_km) {
        errors.push({
          field: 'gps',
          message: `Location is ${distance.toFixed(2)} km away from expected location. Maximum allowed: ${max_distance_km} km`,
          severity: 'error',
        });
      }
    }

    // Check for mock location
    if (rules.gps_rules.mock_location_block && submissionState.currentLocation?.isMockLocation) {
      errors.push({
        field: 'gps',
        message: 'Mock/fake location detected. Please disable location spoofing apps.',
        severity: 'error',
      });
    }

    // Check GPS in media (warning only)
    if (require_exif_gps) {
      const mediaWithoutGps = submissionState.media.filter(
        (m) => !m.gpsLat || !m.gpsLng
      );
      if (mediaWithoutGps.length > 0) {
        warnings.push({
          field: 'media_gps',
          message: `${mediaWithoutGps.length} media file(s) missing GPS data`,
          severity: 'warning',
        });
      }
    }
  }

  // Validate time requirements
  if (rules.time_rules && submissionState.loanDetails) {
    const { max_days_after_sanction, allow_before_sanction } = rules.time_rules;
    const sanctionDate = submissionState.loanDetails.sanctionDate;
    const today = new Date().toISOString();

    const daysSinceSanction = daysBetween(sanctionDate, today);
    const sanctionInFuture = new Date(sanctionDate) > new Date(today);

    if (!allow_before_sanction && sanctionInFuture) {
      errors.push({
        field: 'time',
        message: 'Cannot verify before sanction date',
        severity: 'error',
      });
    }

    if (daysSinceSanction > max_days_after_sanction) {
      errors.push({
        field: 'time',
        message: `Verification must be done within ${max_days_after_sanction} days of sanction. Days elapsed: ${daysSinceSanction}`,
        severity: 'error',
      });
    }
  }

  // Validate document requirements
  if (rules.document_rules) {
    const { require_invoice } = rules.document_rules;

    if (require_invoice) {
      const invoices = submissionState.media.filter((m) => m.type === 'DOCUMENT');
      if (invoices.length === 0) {
        errors.push({
          field: 'invoice',
          message: 'Invoice document is required',
          severity: 'error',
        });
      }
    }
  }

  // Validate image quality (warnings only for now)
  if (rules.image_quality_rules) {
    const { min_resolution } = rules.image_quality_rules;
    
    const lowResImages = submissionState.media.filter(
      (m) =>
        m.type === 'IMAGE' &&
        m.width &&
        m.height &&
        (m.width < min_resolution.width || m.height < min_resolution.height)
    );

    if (lowResImages.length > 0) {
      warnings.push({
        field: 'image_quality',
        message: `${lowResImages.length} image(s) below recommended resolution (${min_resolution.width}x${min_resolution.height})`,
        severity: 'warning',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
