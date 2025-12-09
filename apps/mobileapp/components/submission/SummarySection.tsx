// apps/mobileapp/components/submission/SummarySection.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRuleset } from '../../contexts/RulesContext';
import { useSubmission } from '../../contexts/SubmissionContext';
import { ValidationResult } from '../../types/rules';

interface SummarySectionProps {
  validationResult: ValidationResult | null;
  onValidate: () => void;
  isSubmitting: boolean;
}

export function SummarySection({ validationResult, isSubmitting }: SummarySectionProps) {
  const { submissionState } = useSubmission();
  const { ruleset } = useRuleset();

  if (!ruleset) return null;

  const { rules } = ruleset;

  // Calculate completion status
  const photos = submissionState.media.filter((m) => m.type === 'IMAGE');
  const videos = submissionState.media.filter((m) => m.type === 'VIDEO');
  const invoices = submissionState.media.filter((m) => m.type === 'DOCUMENT');
  const totalVideoSeconds = videos.reduce((sum, v) => sum + (v.duration || 0), 0);

  const checks = [
    {
      label: 'Photos',
      required: rules.media_requirements?.min_photos || 0,
      current: photos.length,
      status: photos.length >= (rules.media_requirements?.min_photos || 0),
    },
    {
      label: 'Video',
      required: rules.media_requirements?.min_video_seconds || 0,
      current: Math.floor(totalVideoSeconds),
      status: totalVideoSeconds >= (rules.media_requirements?.min_video_seconds || 0),
      unit: 's',
    },
    {
      label: 'Invoice',
      required: rules.document_rules?.require_invoice ? 1 : 0,
      current: invoices.length,
      status: !rules.document_rules?.require_invoice || invoices.length > 0,
    },
    {
      label: 'GPS Location',
      required: 1,
      current: submissionState.currentLocation ? 1 : 0,
      status: submissionState.currentLocation !== null,
      hideCount: true,
    },
  ];

  const allChecked = checks.every((check) => check.status);
  const completionPercentage = (checks.filter((c) => c.status).length / checks.length) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Verification Summary</Text>
        <View style={[styles.progressBadge, allChecked && styles.progressBadgeComplete]}>
          <Text style={styles.progressText}>{Math.round(completionPercentage)}%</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${completionPercentage}%` }]} />
      </View>

      {/* Checklist */}
      <View style={styles.checklistContainer}>
        {checks.map((check, index) => (
          <View key={index} style={styles.checkItem}>
            <Ionicons
              name={check.status ? 'checkmark-circle' : 'ellipse-outline'}
              size={22}
              color={check.status ? '#059669' : '#CCC'}
            />
            <Text style={styles.checkLabel}>{check.label}</Text>
            {!check.hideCount && (
              <Text style={[styles.checkValue, check.status && styles.checkValueSuccess]}>
                {check.current} / {check.required}
                {check.unit || ''}
              </Text>
            )}
            {check.hideCount && (
              <Text style={[styles.checkStatus, check.status && styles.checkStatusSuccess]}>
                {check.status ? 'Acquired' : 'Pending'}
              </Text>
            )}
          </View>
        ))}
      </View>

      {/* Validation Errors */}
      {validationResult && !validationResult.valid && (
        <View style={styles.errorsContainer}>
          <View style={styles.errorsHeader}>
            <Ionicons name="alert-circle" size={20} color="#DC2626" />
            <Text style={styles.errorsTitle}>
              {validationResult.errors.length} Error{validationResult.errors.length > 1 ? 's' : ''}{' '}
              Found
            </Text>
          </View>
          {validationResult.errors.map((error, index) => (
            <View key={index} style={styles.errorItem}>
              <Text style={styles.errorBullet}>•</Text>
              <Text style={styles.errorText}>{error.message}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Validation Warnings */}
      {validationResult && validationResult.warnings.length > 0 && (
        <View style={styles.warningsContainer}>
          <View style={styles.warningsHeader}>
            <Ionicons name="warning" size={20} color="#FF9500" />
            <Text style={styles.warningsTitle}>
              {validationResult.warnings.length} Warning{validationResult.warnings.length > 1 ? 's' : ''}
            </Text>
          </View>
          {validationResult.warnings.map((warning, index) => (
            <View key={index} style={styles.warningItem}>
              <Text style={styles.warningBullet}>•</Text>
              <Text style={styles.warningText}>{warning.message}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Success State */}
      {allChecked && !isSubmitting && (
        <View style={styles.successBox}>
          <Ionicons name="checkmark-circle" size={24} color="#059669" />
          <Text style={styles.successText}>Ready to submit!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
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
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  progressBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressBadgeComplete: {
    backgroundColor: '#ECFDF5',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FC8019',
    borderRadius: 4,
  },
  checklistContainer: {
    marginBottom: 12,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkLabel: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 12,
    fontWeight: '500',
  },
  checkValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  checkValueSuccess: {
    color: '#059669',
  },
  checkStatus: {
    fontSize: 13,
    fontWeight: '500',
    color: '#999',
  },
  checkStatusSuccess: {
    color: '#059669',
  },
  errorsContainer: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    marginBottom: 12,
  },
  errorsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  errorsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: 8,
  },
  errorItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  errorBullet: {
    fontSize: 14,
    color: '#DC2626',
    marginRight: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#DC2626',
    lineHeight: 18,
  },
  warningsContainer: {
    backgroundColor: '#FFFBF0',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
    marginBottom: 12,
  },
  warningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  warningsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9500',
    marginLeft: 8,
  },
  warningItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  warningBullet: {
    fontSize: 14,
    color: '#FF9500',
    marginRight: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#FF9500',
    lineHeight: 18,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 8,
  },
  successText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 8,
  },
});
