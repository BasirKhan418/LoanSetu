// apps/mobileapp/components/submission/InvoiceSection.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSubmission } from '../../contexts/SubmissionContext';
import { DocumentRules } from '../../types/rules';
import { getTranslation } from '../../utils/translations';
import { Button } from '../ui/button';

interface InvoiceSectionProps {
  rules: DocumentRules;
}

export function InvoiceSection({ rules }: InvoiceSectionProps) {
  const { currentLanguage } = useLanguage();
  const { submissionState, removeMedia } = useSubmission();

  // Don't render if invoice is not required
  if (!rules.require_invoice) {
    return null;
  }

  const invoices = submissionState.media.filter((m) => m.type === 'DOCUMENT');
  const hasInvoice = invoices.length > 0;
  const invoiceCount = invoices.length;

  const handleRemoveInvoice = (localId: string) => {
    Alert.alert(
      getTranslation('removeInvoice', currentLanguage.code),
      getTranslation('areYouSureRemoveInvoice', currentLanguage.code),
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
      <View style={styles.header}>
        <Text style={styles.title}>
          {rules.label || rules.document_label || getTranslation('invoice', currentLanguage.code)}
        </Text>
        {rules.require_invoice && (
          <View style={[styles.badge, hasInvoice ? styles.badgeSuccess : styles.badgeError]}>
            <Text style={styles.badgeText}>
              {hasInvoice 
                ? `${invoiceCount} ${getTranslation('captured', currentLanguage.code)}` 
                : getTranslation('required', currentLanguage.code)}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.subtitle}>
        {rules.description || 'Capture clear photos of the purchase invoice(s). At least one invoice is required. You can add multiple invoices if needed.'}
      </Text>

      {/* Invoice Preview */}
      {invoices.length > 0 ? (
        <View style={styles.invoicePreview}>
          {invoices.map((invoice) => (
            <View key={invoice.localId} style={styles.invoiceCard}>
              <Image source={{ uri: invoice.localPath }} style={styles.invoiceImage} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveInvoice(invoice.localId)}
              >
                <Ionicons name="close-circle" size={28} color="#DC2626" />
              </TouchableOpacity>
              <View style={styles.invoiceInfo}>
                <Text style={styles.invoiceInfoText}>
                  {new Date(invoice.capturedAt).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Ionicons name="document-text-outline" size={48} color="#CCC" />
          <Text style={styles.placeholderText}>
            {getTranslation('noInvoiceCaptured', currentLanguage.code)}
          </Text>
        </View>
      )}

      {/* Capture Button */}
      <Button
        onPress={() => {
          router.push({
            pathname: '/camera-screen',
            params: { mode: 'PHOTO', label: getTranslation('captureInvoice', currentLanguage.code), photoType: 'invoice' }
          });
        }}
        style={styles.captureButton}
      >
        <Ionicons name="camera" size={20} color="#FFF" style={styles.buttonIcon} />
        {hasInvoice 
          ? getTranslation('addMoreInvoice', currentLanguage.code) 
          : getTranslation('captureInvoice', currentLanguage.code)}
      </Button>

      {/* OCR Information */}
      {(rules.invoice_ocr_match_amount || rules.invoice_ocr_match_date) && (
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={18} color="#FC8019" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>
              {getTranslation('invoiceVerification', currentLanguage.code)}
            </Text>
            <Text style={styles.infoText}>
              {getTranslation('invoiceVerificationDesc', currentLanguage.code)}
            </Text>
            {rules.invoice_ocr_match_amount && (
              <Text style={styles.infoItem}>
                • {getTranslation('amountMatchesSanctioned', currentLanguage.code)}
              </Text>
            )}
            {rules.invoice_ocr_match_date && (
              <Text style={styles.infoItem}>
                • {getTranslation('dateWithinAllowedPeriod', currentLanguage.code)}
              </Text>
            )}
          </View>
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
    marginBottom: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 14,
    lineHeight: 18,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeSuccess: {
    backgroundColor: '#ECFDF5',
  },
  badgeError: {
    backgroundColor: '#FEF2F2',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  invoicePreview: {
    marginBottom: 16,
  },
  invoiceCard: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  invoiceImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#F0F0F0',
    resizeMode: 'contain',
  },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
  },
  invoiceInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
  },
  invoiceInfoText: {
    color: '#FFF',
    fontSize: 12,
    textAlign: 'center',
  },
  placeholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  buttonIcon: {
    marginRight: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  infoContent: {
    flex: 1,
    marginLeft: 8,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoItem: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
});
