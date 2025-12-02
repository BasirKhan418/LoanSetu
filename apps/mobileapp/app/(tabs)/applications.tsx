import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ApplicationsScreen() {
  const applications = [
    { id: 1, type: 'Personal Loan', amount: '₹2,00,000', status: 'Under Review', date: '2024-11-20' },
    { id: 2, type: 'Home Loan', amount: '₹50,00,000', status: 'Approved', date: '2024-11-15' },
    { id: 3, type: 'Car Loan', amount: '₹8,00,000', status: 'Pending', date: '2024-11-18' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return '#28a745';
      case 'Under Review': return '#ffc107';
      case 'Pending': return '#17a2b8';
      default: return '#6c757d';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>My Applications</ThemedText>
        <ThemedText style={styles.subtitle}>Track your loan applications</ThemedText>
      </ThemedView>

      <View style={styles.applicationsList}>
        {applications.map((app) => (
          <TouchableOpacity key={app.id} style={styles.applicationCard}>
            <View style={styles.cardHeader}>
              <ThemedText type="subtitle" style={styles.loanType}>{app.type}</ThemedText>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(app.status) }]}>
                <Text style={styles.statusText}>{app.status}</Text>
              </View>
            </View>
            <ThemedText style={styles.amount}>{app.amount}</ThemedText>
            <ThemedText style={styles.date}>Applied on: {app.date}</ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.newApplicationButton}>
        <Text style={styles.newApplicationText}>+ New Application</Text>
      </TouchableOpacity>
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
  applicationsList: {
    padding: 16,
  },
  applicationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  loanType: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a73e8',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  newApplicationButton: {
    margin: 16,
    backgroundColor: '#1a73e8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  newApplicationText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});