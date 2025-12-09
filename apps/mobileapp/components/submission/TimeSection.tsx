// apps/mobileapp/components/submission/TimeSection.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TimeRules } from '../../types/rules';
import { daysBetween } from '../../utils/validation';

interface TimeSectionProps {
  rules: TimeRules;
  sanctionDate: string;
}

export function TimeSection({ rules, sanctionDate }: TimeSectionProps) {
  const today = new Date().toISOString();
  const daysSinceSanction = daysBetween(sanctionDate, today);
  const sanctionInFuture = new Date(sanctionDate) > new Date(today);

  const isValid =
    !sanctionInFuture &&
    daysSinceSanction <= rules.max_days_after_sanction;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Time Window</Text>
        <Ionicons
          name={isValid ? 'checkmark-circle' : 'alert-circle'}
          size={24}
          color={isValid ? '#059669' : '#DC2626'}
        />
      </View>

      <View style={styles.dateBox}>
        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>Sanction Date:</Text>
          <Text style={styles.dateValue}>{formatDate(sanctionDate)}</Text>
        </View>
        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>Today:</Text>
          <Text style={styles.dateValue}>{formatDate(today)}</Text>
        </View>
        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>Days Elapsed:</Text>
          <Text style={[styles.dateValue, styles.daysBold]}>
            {sanctionInFuture ? '0' : daysSinceSanction} days
          </Text>
        </View>
      </View>

      <View style={styles.ruleBox}>
        <Text style={styles.ruleTitle}>Verification Window</Text>
        <Text style={styles.ruleText}>
          • Verification must be completed within{' '}
          <Text style={styles.ruleBold}>{rules.max_days_after_sanction} days</Text> of sanction
        </Text>
        {!rules.allow_before_sanction && (
          <Text style={styles.ruleText}>
            • Verification before sanction date is not allowed
          </Text>
        )}
      </View>

      <View
        style={[
          styles.statusBox,
          isValid ? styles.statusBoxSuccess : styles.statusBoxError,
        ]}
      >
        <Ionicons
          name={isValid ? 'checkmark-circle' : 'close-circle'}
          size={20}
          color={isValid ? '#059669' : '#DC2626'}
        />
        <Text
          style={[
            styles.statusText,
            isValid ? styles.statusTextSuccess : styles.statusTextError,
          ]}
        >
          {sanctionInFuture
            ? 'Sanction date is in the future'
            : isValid
            ? 'Within allowed time window'
            : `Time window expired (${daysSinceSanction - rules.max_days_after_sanction} days overdue)`}
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
    color: '#1F2937',
  },
  dateBox: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  dateValue: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '600',
  },
  daysBold: {
    fontWeight: '700',
    color: '#FC8019',
  },
  ruleBox: {
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    borderRadius: 8,
    marginBottom: 12,
  },
  ruleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  ruleText: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 4,
    lineHeight: 20,
  },
  ruleBold: {
    fontWeight: '700',
    color: '#FC8019',
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBoxSuccess: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  statusBoxError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statusText: {
    flex: 1,
    fontSize: 13,
    marginLeft: 8,
    fontWeight: '600',
  },
  statusTextSuccess: {
    color: '#059669',
  },
  statusTextError: {
    color: '#DC2626',
  },
});
