import { LocationPopup } from '@/components/LocationPopup';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useLocation } from '@/contexts/LocationContext';
import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function DashboardScreen() {
  const { showLocationPopup, hasSetLocation } = useLocation();

  // Show location popup on mount if location not set
  useEffect(() => {
    if (!hasSetLocation) {
      // Small delay to allow screen to render
      const timer = setTimeout(() => {
        showLocationPopup();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [hasSetLocation, showLocationPopup]);
  // Mock user data
  const user = {
    name: 'John Doe',
    totalLoans: 2,
    activeApplications: 1,
    totalAmount: '₹15,00,000',
  };

  const quickActions = [
    { id: 1, title: 'Apply for Loan', icon: '💰', color: '#1a73e8' },
    { id: 2, title: 'Check Status', icon: '📋', color: '#28a745' },
    { id: 3, title: 'Make Payment', icon: '💳', color: '#ffc107' },
    { id: 4, title: 'Support', icon: '🎧', color: '#17a2b8' },
  ];

  const recentActivities = [
    { id: 1, title: 'Personal Loan Approved', amount: '₹5,00,000', date: '2024-11-20', status: 'approved' },
    { id: 2, title: 'EMI Payment Due', amount: '₹12,500', date: '2024-11-25', status: 'pending' },
    { id: 3, title: 'Document Verified', amount: '', date: '2024-11-18', status: 'completed' },
  ];

  return (
    <>
      <LocationPopup />
      <ScrollView style={styles.container}>
        {/* Header */}
        <ThemedView style={styles.header}>
        <Text style={styles.greeting}>Good Morning,</Text>
        <ThemedText type="title" style={styles.userName}>{user.name}</ThemedText>
        <Text style={styles.subtitle}>Welcome back to LoanSetu</Text>
      </ThemedView>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsCard}>
          <Text style={styles.statsValue}>{user.totalLoans}</Text>
          <Text style={styles.statsLabel}>Active Loans</Text>
        </View>
        <View style={styles.statsCard}>
          <Text style={styles.statsValue}>{user.activeApplications}</Text>
          <Text style={styles.statsLabel}>Applications</Text>
        </View>
        <View style={styles.statsCard}>
          <Text style={styles.statsValue}>{user.totalAmount}</Text>
          <Text style={styles.statsLabel}>Total Amount</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Quick Actions</ThemedText>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity key={action.id} style={[styles.actionCard, { backgroundColor: action.color }]}>
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={styles.actionTitle}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Activities */}
      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Recent Activities</ThemedText>
        <View style={styles.activitiesList}>
          {recentActivities.map((activity) => (
            <View key={activity.id} style={styles.activityCard}>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                {activity.amount && <Text style={styles.activityAmount}>{activity.amount}</Text>}
                <Text style={styles.activityDate}>{activity.date}</Text>
              </View>
              <View style={[styles.activityStatus, { backgroundColor: getStatusColor(activity.status) }]}>
                <Text style={styles.statusText}>{activity.status}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Loan Calculator Banner */}
      <TouchableOpacity style={styles.calculatorBanner}>
        <View>
          <Text style={styles.bannerTitle}>📊 Loan Calculator</Text>
          <Text style={styles.bannerSubtitle}>Calculate your EMI instantly</Text>
        </View>
        <Text style={styles.bannerArrow}>›</Text>
      </TouchableOpacity>
    </ScrollView>
    </>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'approved': return '#28a745';
    case 'pending': return '#ffc107';
    case 'completed': return '#17a2b8';
    default: return '#6c757d';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#1a73e8',
    padding: 24,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 18,
    color: '#ffffff',
    opacity: 0.9,
  },
  userName: {
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a73e8',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 16,
    color: '#333',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  activitiesList: {
    gap: 12,
  },
  activityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  activityAmount: {
    fontSize: 14,
    color: '#1a73e8',
    fontWeight: '600',
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 12,
    color: '#666',
  },
  activityStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  calculatorBanner: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  bannerArrow: {
    fontSize: 24,
    color: '#1a73e8',
  },
});
