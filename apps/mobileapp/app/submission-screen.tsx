// apps/mobileapp/app/submission-screen.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CheckCircle, FileText } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCustomAlert } from '../components/CustomAlert';
import { DESIGN_SYSTEM, getTabBarHeight } from '../constants/designSystem';
import { useRuleset } from '../contexts/RulesContext';
import { useSubmission } from '../contexts/SubmissionContext';
import { ValidationResult } from '../types/rules';
import { LoanDetails } from '../types/submission';
import { validateSubmission } from '../utils/validation';

// Section imports (we'll create these next)
import { AssetSection } from '../components/submission/AssetSection';
import { GpsSection } from '../components/submission/GpsSection';
import { InvoiceSection } from '../components/submission/InvoiceSection';
import { MediaSection } from '../components/submission/MediaSection';
import { SummarySection } from '../components/submission/SummarySection';
import { TimeSection } from '../components/submission/TimeSection';

export default function SubmissionScreen() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { showAlert, AlertComponent } = useCustomAlert();
  const { ruleset, isLoading: rulesLoading, fetchRuleset } = useRuleset();
  const {
    submissionState,
    initializeSubmission,
    saveToSQLite,
    isLoading: submissionLoading,
  } = useSubmission();

  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoanDetailsExpanded, setIsLoanDetailsExpanded] = useState(false);
  
  const tabBarHeight = getTabBarHeight(insets.bottom);

  useEffect(() => {
    // Fetch ruleset on mount
    fetchRuleset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Initialize submission with loan details from params
    // Only run when loanId changes or when we don't have a submission yet
    const loanId = params.loanId as string;
    
    if (loanId && !submissionState.submissionId) {
      const loanDetails: LoanDetails = {
        loanId: loanId,
        loanReferenceId: (params.loanReferenceId as string) || '',
        beneficiaryId: (params.beneficiaryId as string) || '',
        beneficiaryName: (params.beneficiaryName as string) || '',
        schemeName: (params.schemeName as string) || '',
        sanctionAmount: parseFloat((params.sanctionAmount as string) || '0'),
        sanctionDate: (params.sanctionDate as string) || new Date().toISOString(),
        assetType: (params.assetType as string) || 'TRACTOR',
        expectedLocation: params.expectedLat && params.expectedLng ? {
          latitude: parseFloat(params.expectedLat as string),
          longitude: parseFloat(params.expectedLng as string),
          address: params.expectedAddress as string,
        } : undefined,
        tenantId: (params.tenantId as string) || '',
      };

      initializeSubmission(loanDetails);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.loanId, submissionState.submissionId]);

  const handleValidateAndSubmit = async () => {
    if (!ruleset || !submissionState.loanDetails) {
      showAlert(
        'error',
        'Error',
        'Ruleset or loan details not available',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    // Run validation
    const result = validateSubmission(ruleset, submissionState);
    setValidationResult(result);

    if (!result.valid) {
      showAlert(
        'error',
        'Validation Failed',
        `Please fix the following errors:\n\n${result.errors.map((e) => `• ${e.message}`).join('\n')}`,
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    // Show warnings if any
    if (result.warnings.length > 0) {
      showAlert(
        'warning',
        'Warnings Detected',
        `The following warnings were detected:\n\n${result.warnings.map((w) => `• ${w.message}`).join('\n')}\n\nDo you want to continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', style: 'default', onPress: () => submitLocally() },
        ]
      );
    } else {
      submitLocally();
    }
  };

  const submitLocally = async () => {
    setIsSubmitting(true);
    try {
      await saveToSQLite('PENDING_SYNC');
      
      showAlert(
        'success',
        'Saved Successfully',
        'Your verification has been saved locally and will be synced when network is available.',
        [
          {
            text: 'OK',
            style: 'default',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving submission:', error);
      showAlert(
        'error',
        'Error',
        'Failed to save submission. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (rulesLoading || !ruleset) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={[DESIGN_SYSTEM.colors.primaryLight, DESIGN_SYSTEM.colors.white]}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color={DESIGN_SYSTEM.colors.primary} />
        <Text style={styles.loadingText}>Loading verification rules...</Text>
      </View>
    );
  }

  const { rules } = ruleset;

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        {/* Simple White Header */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <ArrowLeft size={22} color="#1F2937" strokeWidth={2.5} />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Verification Form</Text>
              <Text style={styles.headerSubtitle}>{ruleset.name}</Text>
            </View>
          </View>
        </View>

        {/* Collapsible Loan Details Card */}
        {submissionState.loanDetails && (
          <View style={styles.loanCardWrapper}>
            <TouchableOpacity 
              style={styles.loanCard}
              activeOpacity={0.8}
              onPress={() => setIsLoanDetailsExpanded(!isLoanDetailsExpanded)}
            >
              <View style={styles.loanCardHeader}>
                <View style={styles.loanIconContainer}>
                  <FileText size={18} color="#FC8019" strokeWidth={2} />
                </View>
                <View style={styles.loanHeaderText}>
                  <Text style={styles.loanCardTitle}>Loan Information</Text>
                  <Text style={styles.loanCardSubtitle}>
                    {submissionState.loanDetails.loanReferenceId}
                  </Text>
                </View>
                <CheckCircle 
                  size={20} 
                  color={isLoanDetailsExpanded ? '#FC8019' : '#D1D5DB'} 
                  strokeWidth={2} 
                  style={{ transform: [{ rotate: isLoanDetailsExpanded ? '0deg' : '180deg' }] }}
                />
              </View>
              
              {isLoanDetailsExpanded && (
                <View style={styles.loanGrid}>
                  <View style={styles.loanGridRow}>
                    <View style={styles.loanGridItem}>
                      <Text style={styles.loanLabel}>Beneficiary</Text>
                      <Text style={styles.loanValue} numberOfLines={1}>
                        {submissionState.loanDetails.beneficiaryName}
                      </Text>
                    </View>
                    <View style={styles.loanGridItem}>
                      <Text style={styles.loanLabel}>Sanctioned Amount</Text>
                      <Text style={[styles.loanValue, styles.loanAmount]}>
                        ₹{submissionState.loanDetails.sanctionAmount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.loanGridRow}>
                    <View style={styles.loanGridItem}>
                      <Text style={styles.loanLabel}>Scheme</Text>
                      <Text style={styles.loanValue} numberOfLines={1}>
                        {submissionState.loanDetails.schemeName}
                      </Text>
                    </View>
                    <View style={styles.loanGridItem}>
                      <Text style={styles.loanLabel}>Sanction Date</Text>
                      <Text style={styles.loanValue}>
                        {new Date(submissionState.loanDetails.sanctionDate).toLocaleDateString('en-IN')}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Compact ScrollView for Sections */}
        <ScrollView 
          style={styles.scrollContent}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: tabBarHeight + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Conditionally render sections based on rules */}
          {rules.asset_rules && (
            <AssetSection rules={rules.asset_rules} />
          )}

          {rules.time_rules && submissionState.loanDetails && (
            <TimeSection 
              rules={rules.time_rules} 
              sanctionDate={submissionState.loanDetails.sanctionDate}
            />
          )}

          {rules.gps_rules && submissionState.loanDetails && (
            <GpsSection 
              rules={rules.gps_rules}
              expectedLocation={submissionState.loanDetails.expectedLocation}
            />
          )}

          {rules.media_requirements && (
            <MediaSection rules={rules.media_requirements} />
          )}

          {rules.document_rules && (
            <InvoiceSection rules={rules.document_rules} />
          )}

          {/* Summary with validation */}
          <SummarySection 
            validationResult={validationResult}
            onValidate={handleValidateAndSubmit}
            isSubmitting={isSubmitting}
          />

          {/* Submit Button at the end inside ScrollView */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (isSubmitting || submissionLoading) && styles.submitButtonDisabled
            ]}
            onPress={handleValidateAndSubmit}
            disabled={isSubmitting || submissionLoading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[DESIGN_SYSTEM.colors.primary, DESIGN_SYSTEM.colors.primaryDark]}
              style={styles.submitGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator size="small" color={DESIGN_SYSTEM.colors.white} />
                  <Text style={styles.submitText}>Saving Verification...</Text>
                </>
              ) : (
                <>
                  <CheckCircle size={20} color={DESIGN_SYSTEM.colors.white} strokeWidth={2.5} />
                  <Text style={styles.submitText}>Submit Verification</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
      <AlertComponent />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  // Clean White Header
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
    gap: 12,
    paddingTop: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  // Collapsible Loan Details Card
  loanCardWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#F9FAFB',
  },
  loanCard: {
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
  loanCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loanIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FC8019',
  },
  loanHeaderText: {
    flex: 1,
  },
  loanCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  loanCardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  loanGrid: {
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  loanGridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  loanGridItem: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 8,
  },
  loanLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  loanValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  loanAmount: {
    color: '#FC8019',
    fontSize: 14,
  },
  // Clean ScrollView
  scrollContent: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    padding: 16,
    gap: 12,
  },
  // Submit Button inside ScrollView
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  submitText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
