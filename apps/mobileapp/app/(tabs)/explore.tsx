import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LoansScreen() {
  const loanProducts = [
    {
      id: 1,
      title: 'Personal Loan',
      description: 'Quick approval for personal needs',
      interestRate: '10.5% - 24%',
      amount: 'Up to ₹25 Lakhs',
      tenure: '12 - 60 months',
      color: '#1a73e8',
    },
    {
      id: 2,
      title: 'Home Loan',
      description: 'Affordable rates for your dream home',
      interestRate: '8.5% - 12%',
      amount: 'Up to ₹5 Crores',
      tenure: '5 - 30 years',
      color: '#28a745',
    },
    {
      id: 3,
      title: 'Car Loan',
      description: 'Drive your dream car today',
      interestRate: '9% - 15%',
      amount: 'Up to ₹1.5 Crores',
      tenure: '1 - 7 years',
      color: '#ffc107',
    },
    {
      id: 4,
      title: 'Business Loan',
      description: 'Fuel your business growth',
      interestRate: '12% - 18%',
      amount: 'Up to ₹50 Lakhs',
      tenure: '12 - 84 months',
      color: '#17a2b8',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>Loan Products</ThemedText>
        <ThemedText style={styles.subtitle}>Choose the right loan for your needs</ThemedText>
      </ThemedView>

      <View style={styles.loansList}>
        {loanProducts.map((loan) => (
          <TouchableOpacity key={loan.id} style={styles.loanCard}>
            <View style={[styles.cardHeader, { backgroundColor: loan.color }]}>
              <ThemedText type="subtitle" style={styles.loanTitle}>{loan.title}</ThemedText>
              <ThemedText style={styles.loanDescription}>{loan.description}</ThemedText>
            </View>
            
            <View style={styles.cardContent}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Interest Rate:</Text>
                <Text style={styles.detailValue}>{loan.interestRate}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Loan Amount:</Text>
                <Text style={styles.detailValue}>{loan.amount}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tenure:</Text>
                <Text style={styles.detailValue}>{loan.tenure}</Text>
              </View>

              <TouchableOpacity style={[styles.applyButton, { backgroundColor: loan.color }]}>
                <Text style={styles.applyButtonText}>Apply Now</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.infoSection}>
        <ThemedText type="subtitle" style={styles.infoTitle}>Why Choose LoanSetu?</ThemedText>
        <View style={styles.featuresList}>
          <Text style={styles.featureItem}>✓ Quick approval process</Text>
          <Text style={styles.featureItem}>✓ Competitive interest rates</Text>
          <Text style={styles.featureItem}>✓ Minimal documentation</Text>
          <Text style={styles.featureItem}>✓ Flexible repayment options</Text>
          <Text style={styles.featureItem}>✓ 24/7 customer support</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 24,
    backgroundColor: '#1a73e8',
  },
  title: {
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    color: '#ffffff',
    opacity: 0.8,
    fontSize: 16,
  },
  loansList: {
    padding: 16,
  },
  loanCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    padding: 16,
  },
  loanTitle: {
    color: '#ffffff',
    marginBottom: 4,
  },
  loanDescription: {
    color: '#ffffff',
    opacity: 0.9,
    fontSize: 14,
  },
  cardContent: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  applyButton: {
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    margin: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
  },
  infoTitle: {
    marginBottom: 12,
    color: '#1a73e8',
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});
