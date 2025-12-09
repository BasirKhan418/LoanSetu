// apps/mobileapp/contexts/RulesContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { RuleSet } from '../types/rules';
import { useAuth } from './AuthContext';

interface RulesContextType {
  ruleset: RuleSet | null;
  isLoading: boolean;
  error: string | null;
  fetchRuleset: (loanId?: string) => Promise<void>;
  clearRuleset: () => void;
}

const RulesContext = createContext<RulesContextType | undefined>(undefined);

export function useRuleset() {
  const context = useContext(RulesContext);
  if (context === undefined) {
    throw new Error('useRuleset must be used within a RulesProvider');
  }
  return context;
}

export function RulesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [ruleset, setRuleset] = useState<RuleSet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRuleset = async (loanId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // If loanId is provided, fetch ruleset from API
      if (loanId) {
        const { getLoanWithRuleset } = await import('../api/loansService');
        const response = await getLoanWithRuleset(loanId);
        
        if (response.success && response.data?.ruleset) {
          const fetchedRuleset = response.data.ruleset;
          // Map the API response to RuleSet type
          const mappedRuleset: RuleSet = {
            _id: fetchedRuleset._id,
            name: fetchedRuleset.name || 'Verification Rules',
            description: fetchedRuleset.description || '',
            tenantId: fetchedRuleset.tenantId || user?.tenantId || '',
            version: fetchedRuleset.version || 1,
            rules: fetchedRuleset.rules || {},
            isActive: fetchedRuleset.isActive,
            createdAt: fetchedRuleset.createdAt,
            updatedAt: fetchedRuleset.updatedAt,
          };
          setRuleset(mappedRuleset);
          console.log('[RulesContext] Fetched ruleset from API:', mappedRuleset.name);
          return;
        } else {
          console.warn('[RulesContext] No ruleset found in API response, using default');
        }
      }
      
      // Fallback to default ruleset for offline/development
      console.log('[RulesContext] Using default ruleset');
      setRuleset(getDefaultRuleset());
    } catch (err) {
      console.error('[RulesContext] Error fetching ruleset:', err);
      // Fallback to default ruleset
      setRuleset(getDefaultRuleset());
      setError(null); // Don't show error if we have fallback
    } finally {
      setIsLoading(false);
    }
  };

  const clearRuleset = () => {
    setRuleset(null);
    setError(null);
  };

  // Default ruleset for PMEGP Tractor Verification - Odisha 2025
  const getDefaultRuleset = (): RuleSet => ({
    name: 'PMEGP Tractor Verification – Odisha 2025',
    description: 'Official RuleSet for validating tractor purchase under PMEGP scheme for Odisha state.',
    tenantId: user?.tenantId || '6932e9e9d1c65c91b68a771a',
    version: 1,
    rules: {
      media_requirements: {
        min_photos: 4,
        min_video_seconds: 10,
        allowed_mime_types: ['image/jpeg', 'image/png', 'video/mp4'],
        label: 'Photos & Video',
        description: 'Capture clear media using camera only',
        photo_label: '📸 Photos',
        video_label: '🎥 Video',
      },
      gps_rules: {
        max_distance_km: 5,
        require_exif_gps: true,
        mock_location_block: true,
        label: 'Location',
        description: 'Your location is automatically captured with each photo and video. GPS must remain enabled.',
      },
      time_rules: {
        max_days_after_sanction: 30,
        allow_before_sanction: false,
        label: 'Time Window',
        description: 'Verification must be completed within the specified time period.',
      },
      image_quality_rules: {
        max_blur_variance: 120,
        min_resolution: {
          width: 800,
          height: 600,
        },
        reject_screenshots: true,
        reject_printed_photos: true,
      },
      fraud_detection_rules: {
        duplicate_detection: true,
        max_hash_distance: 8,
        ela_tampering_check: true,
        ai_generated_detection: true,
        printed_photo_detection: true,
      },
      document_rules: {
        require_invoice: true,
        invoice_ocr_match_amount: true,
        invoice_ocr_match_date: true,
        label: 'Invoice',
        description: 'Capture clear photos of the purchase invoice(s). At least one invoice is required. You can add multiple invoices if needed.',
        document_label: 'Invoice',
      },
      asset_rules: {
        allowed_asset_types: ['TRACTOR'],
        classifier_required: true,
        confidence_threshold: 0.80,
        label: 'Asset Information',
        description: 'Verify the asset type and ensure clear documentation.',
        tips: [
          'Ensure good lighting conditions',
          'Capture from multiple angles',
          'Include identifying features clearly',
          'Avoid blurry or dark images',
        ],
      },
      risk_weights: {
        GPS_MISMATCH: 25,
        EXIF_MISSING: 20,
        TIME_MISMATCH: 15,
        DUPLICATE_IMAGE: 35,
        UNKNOWN_ASSET: 30,
        ELA_TAMPERED: 30,
        AI_GENERATED: 40,
        INVOICE_MISSING: 20,
        LOW_QUALITY: 15,
        PRINTED_PHOTO_DETECTED: 25,
        SCREENSHOT_DETECTED: 20,
      },
      thresholds: {
        auto_approve_max_risk: 20,
        manual_review_min_risk: 21,
        high_risk_min_risk: 60,
      },
    },
  });

  return (
    <RulesContext.Provider
      value={{
        ruleset,
        isLoading,
        error,
        fetchRuleset,
        clearRuleset,
      }}
    >
      {children}
    </RulesContext.Provider>
  );
}
