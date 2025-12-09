export interface MediaRequirements {
  min_photos: number;
  min_video_seconds: number;
  allowed_mime_types: string[];
}

export interface GpsRules {
  max_distance_km: number;
  require_exif_gps: boolean;
  mock_location_block: boolean;
}

export interface TimeRules {
  max_days_after_sanction: number;
  allow_before_sanction: boolean;
}

export interface ImageQualityRules {
  max_blur_variance: number;
  min_resolution: {
    width: number;
    height: number;
  };
  reject_screenshots: boolean;
  reject_printed_photos: boolean;
}

export interface FraudDetectionRules {
  duplicate_detection: boolean;
  max_hash_distance: number;
  ela_tampering_check: boolean;
  ai_generated_detection: boolean;
  printed_photo_detection: boolean;
}

export interface DocumentRules {
  require_invoice: boolean;
  invoice_ocr_match_amount: boolean;
  invoice_ocr_match_date: boolean;
}

export interface AssetRules {
  allowed_asset_types: string[];
  classifier_required: boolean;
  confidence_threshold: number;
}

export interface RiskWeights {
  GPS_MISMATCH: number;
  EXIF_MISSING: number;
  TIME_MISMATCH: number;
  DUPLICATE_IMAGE: number;
  UNKNOWN_ASSET: number;
  ELA_TAMPERED: number;
  AI_GENERATED: number;
  INVOICE_MISSING: number;
  LOW_QUALITY: number;
  PRINTED_PHOTO_DETECTED: number;
  SCREENSHOT_DETECTED: number;
}

export interface Thresholds {
  auto_approve_max_risk: number;
  manual_review_min_risk: number;
  high_risk_min_risk: number;
}

export interface Rules {
  media_requirements?: MediaRequirements;
  gps_rules?: GpsRules;
  time_rules?: TimeRules;
  image_quality_rules?: ImageQualityRules;
  fraud_detection_rules?: FraudDetectionRules;
  document_rules?: DocumentRules;
  asset_rules?: AssetRules;
  risk_weights?: RiskWeights;
  thresholds?: Thresholds;
}

export interface RuleSet {
  _id?: string;
  name: string;
  description: string;
  tenantId: string;
  version: number;
  rules: Rules;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}
