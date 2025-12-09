// apps/mobileapp/components/submission/AssetSection.tsx
import { Lightbulb, Package, Sparkles } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AssetRules } from '../../types/rules';

interface AssetSectionProps {
  rules: AssetRules;
}

export function AssetSection({ rules }: AssetSectionProps) {
  const assetTypes = rules.allowed_asset_types.join(', ');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Package size={20} color="#FC8019" strokeWidth={2} />
        <Text style={styles.title}>Asset Information</Text>
      </View>

      {/* Asset Type */}
      <View style={styles.assetBox}>
        <Text style={styles.label}>ALLOWED ASSET TYPE</Text>
        <Text style={styles.value}>{assetTypes}</Text>
      </View>

      {/* AI Verification */}
      {rules.classifier_required && (
        <View style={styles.aiBox}>
          <View style={styles.aiHeader}>
            <Sparkles size={18} color="#FC8019" strokeWidth={2} />
            <Text style={styles.aiTitle}>AI Verification Enabled</Text>
          </View>
          <Text style={styles.aiText}>
            Photos will be automatically analyzed to detect the asset type. The asset must be
            clearly visible in the images.
          </Text>
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>
              Required Confidence: {(rules.confidence_threshold * 100).toFixed(0)}%
            </Text>
          </View>
        </View>
      )}

      {/* Photography Tips */}
      <View style={styles.tipsBox}>
        <View style={styles.tipsHeader}>
          <Lightbulb size={18} color="#F59E0B" strokeWidth={2} />
          <Text style={styles.tipsTitle}>Photography Tips</Text>
        </View>
        <View style={styles.tipsList}>
          <View style={styles.tipItem}>
            <View style={styles.tipDot} />
            <Text style={styles.tipText}>Ensure good lighting conditions</Text>
          </View>
          <View style={styles.tipItem}>
            <View style={styles.tipDot} />
            <Text style={styles.tipText}>Capture from multiple angles</Text>
          </View>
          <View style={styles.tipItem}>
            <View style={styles.tipDot} />
            <Text style={styles.tipText}>Include identifying features clearly</Text>
          </View>
          <View style={styles.tipItem}>
            <View style={styles.tipDot} />
            <Text style={styles.tipText}>Avoid blurry or dark images</Text>
          </View>
        </View>
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
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  assetBox: {
    backgroundColor: '#FFF7ED',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FC8019',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  aiBox: {
    backgroundColor: '#FFF7ED',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  aiText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
    marginBottom: 8,
  },
  confidenceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FC8019',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tipsBox: {
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tipDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#F59E0B',
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
});
