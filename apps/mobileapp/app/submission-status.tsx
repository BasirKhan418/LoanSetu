// apps/mobileapp/app/submission-status.tsx
import { router } from 'expo-router';
import { AlertCircle, CheckCircle, ChevronLeft, Clock, MapPin, RefreshCw } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDatabase } from '@/contexts/DatabaseContext';
import { MediaFile, Submission } from '@/database/schema';
import { submissionService } from '@/services/submissionService';

const { width } = Dimensions.get('window');
const scale = width / 375;

type SubmissionWithMedia = Submission & { mediaFiles: MediaFile[] };

export default function SubmissionStatusScreen() {
  const insets = useSafeAreaInsets();
  const { isSyncing, syncNow, isOnline, isInitialized } = useDatabase();
  const [submissions, setSubmissions] = useState<SubmissionWithMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0, synced: 0, failed: 0 });

  const tabBarHeight = Platform.OS === 'ios' 
    ? Math.max(80, 50 + insets.bottom) 
    : Math.max(70, 60 + insets.bottom);

  const loadSubmissions = useCallback(async () => {
    try {
      if (!isInitialized) return;
      
      const data = await submissionService.getAllSubmissions();
      setSubmissions(data);
      
      const statistics = await submissionService.getStatistics();
      setStats(statistics);
    } catch (error) {
      console.error('Error loading submissions:', error);
      Alert.alert('Error', 'Failed to load submissions');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      loadSubmissions();
    }
  }, [isInitialized, loadSubmissions]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSubmissions();
  };

  const handleSyncNow = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'You need to be online to sync submissions.');
      return;
    }

    try {
      const result = await syncNow();
      await loadSubmissions();

      if (result.success) {
        Alert.alert(
          'Sync Complete',
          `Synced: ${result.syncedCount}\nFailed: ${result.failedCount}`
        );
      } else {
        Alert.alert('Sync Failed', result.errors.join('\n'));
      }
    } catch (error) {
      console.error('Error during sync:', error);
      Alert.alert('Error', 'Failed to sync submissions');
    }
  };

  const handleRetry = async (submission: SubmissionWithMedia) => {
    try {
      await submissionService.markAsPending(submission.id);
      await loadSubmissions();
      
      if (isOnline) {
        syncNow();
      } else {
        Alert.alert('Marked for Retry', 'Submission will sync when you\'re back online.');
      }
    } catch (error) {
      console.error('Error retrying submission:', error);
      Alert.alert('Error', 'Failed to retry submission');
    }
  };

  const getSyncStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          icon: <Clock size={14} color="#f59e0b" strokeWidth={2} />,
          text: 'Pending Sync',
          bgColor: '#FEF3C7',
          textColor: '#92400e',
        };
      case 'SYNCED':
        return {
          icon: <CheckCircle size={14} color="#10b981" strokeWidth={2} />,
          text: 'Synced',
          bgColor: '#D1FAE5',
          textColor: '#065f46',
        };
      case 'FAILED':
        return {
          icon: <AlertCircle size={14} color="#ef4444" strokeWidth={2} />,
          text: 'Failed',
          bgColor: '#FEE2E2',
          textColor: '#991b1b',
        };
      default:
        return {
          icon: <Clock size={14} color="#6B7280" strokeWidth={2} />,
          text: 'Unknown',
          bgColor: '#F3F4F6',
          textColor: '#4B5563',
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isInitialized || isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#FC8019" />
        <Text style={styles.loadingText}>Loading submissions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color="#1F2937" strokeWidth={2.5} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Submission Status</Text>
            <Text style={styles.headerSubtitle}>
              {stats.total} total • {stats.pending} pending
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.syncButton, isSyncing && styles.syncButtonActive]}
            onPress={handleSyncNow}
            disabled={isSyncing || !isOnline}
            activeOpacity={0.7}
          >
            <RefreshCw 
              size={20} 
              color={isSyncing || !isOnline ? '#9CA3AF' : '#FC8019'} 
              strokeWidth={2}
              style={isSyncing ? styles.spinning : undefined}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
            <Clock size={20} color="#f59e0b" strokeWidth={2} />
          </View>
          <Text style={styles.statValue}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
            <CheckCircle size={20} color="#10b981" strokeWidth={2} />
          </View>
          <Text style={styles.statValue}>{stats.synced}</Text>
          <Text style={styles.statLabel}>Synced</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#FEE2E2' }]}>
            <AlertCircle size={20} color="#ef4444" strokeWidth={2} />
          </View>
          <Text style={styles.statValue}>{stats.failed}</Text>
          <Text style={styles.statLabel}>Failed</Text>
        </View>
      </View>

      {/* Submissions List */}
      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.submissionsContainer}>
          {submissions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No submissions yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Submit a loan verification to see it here
              </Text>
            </View>
          ) : (
            submissions.map((submission) => {
              const badge = getSyncStatusBadge(submission.syncStatus);
              const photoCount = submission.mediaFiles.filter(f => f.type === 'PHOTO').length;
              const hasInvoice = submission.mediaFiles.some(f => f.type === 'INVOICE');

              return (
                <View key={submission.id} style={styles.submissionCard}>
                  <View style={styles.submissionHeader}>
                    <View style={styles.submissionInfo}>
                      <Text style={styles.submissionTitle}>
                        {submission.productName}
                      </Text>
                      <Text style={styles.submissionDate}>
                        {formatDate(submission.createdAt)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: badge.bgColor },
                      ]}
                    >
                      {badge.icon}
                      <Text
                        style={[styles.statusText, { color: badge.textColor }]}
                      >
                        {badge.text}
                      </Text>
                    </View>
                  </View>

                  {submission.loanSchemeName && (
                    <Text style={styles.submissionScheme}>
                      {submission.loanSchemeName}
                    </Text>
                  )}

                  <View style={styles.submissionDetails}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Reference:</Text>
                      <Text style={styles.detailValue}>
                        {submission.localUuid.substring(0, 8)}...
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Files:</Text>
                      <Text style={styles.detailValue}>
                        {photoCount} photos{hasInvoice ? ' + invoice' : ''}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.submissionLocation}>
                    <MapPin size={14} color="#6B7280" strokeWidth={2} />
                    <Text style={styles.locationText}>
                      {submission.geoLat.toFixed(6)}, {submission.geoLng.toFixed(6)}
                    </Text>
                  </View>

                  {submission.syncStatus === 'FAILED' && submission.errorMessage && (
                    <View style={styles.errorContainer}>
                      <AlertCircle size={14} color="#ef4444" strokeWidth={2} />
                      <Text style={styles.errorText}>
                        {submission.errorMessage}
                      </Text>
                    </View>
                  )}

                  {submission.syncStatus === 'FAILED' && (
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={() => handleRetry(submission)}
                      activeOpacity={0.7}
                    >
                      <RefreshCw size={16} color="#FC8019" strokeWidth={2} />
                      <Text style={styles.retryButtonText}>Retry Sync</Text>
                    </TouchableOpacity>
                  )}

                  {submission.syncStatus === 'SYNCED' && submission.remoteId && (
                    <View style={styles.remoteIdContainer}>
                      <CheckCircle size={14} color="#10b981" strokeWidth={2} />
                      <Text style={styles.remoteIdText}>
                        Server ID: {submission.remoteId}
                      </Text>
                    </View>
                  )}

                  {submission.retryCount > 0 && submission.syncStatus === 'PENDING' && (
                    <Text style={styles.retryCountText}>
                      Retry attempt: {submission.retryCount}
                    </Text>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Math.max(20, scale * 22),
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: Math.max(13, scale * 14),
    color: '#6B7280',
  },
  syncButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF8F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFE5D0',
  },
  syncButtonActive: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  spinning: {
    transform: [{ rotate: '360deg' }],
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: Math.max(24, scale * 26),
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: Math.max(12, scale * 13),
    color: '#6B7280',
    fontWeight: '500',
  },
  scrollContent: {
    flex: 1,
  },
  submissionsContainer: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: Math.max(16, scale * 18),
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: Math.max(14, scale * 15),
    color: '#9CA3AF',
  },
  submissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  submissionInfo: {
    flex: 1,
    marginRight: 12,
  },
  submissionTitle: {
    fontSize: Math.max(16, scale * 17),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  submissionDate: {
    fontSize: Math.max(12, scale * 13),
    color: '#9CA3AF',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: Math.max(12, scale * 13),
    fontWeight: '600',
  },
  submissionScheme: {
    fontSize: Math.max(14, scale * 15),
    color: '#4B5563',
    marginBottom: 12,
  },
  submissionDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: Math.max(11, scale * 12),
    color: '#9CA3AF',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: Math.max(13, scale * 14),
    color: '#4B5563',
    fontWeight: '500',
  },
  submissionLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  locationText: {
    fontSize: Math.max(12, scale * 13),
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  errorText: {
    flex: 1,
    fontSize: Math.max(12, scale * 13),
    color: '#991b1b',
    lineHeight: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF8F5',
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FFE5D0',
  },
  retryButtonText: {
    fontSize: Math.max(14, scale * 15),
    fontWeight: '600',
    color: '#FC8019',
  },
  remoteIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  remoteIdText: {
    fontSize: Math.max(12, scale * 13),
    color: '#059669',
    fontWeight: '500',
  },
  retryCountText: {
    fontSize: Math.max(11, scale * 12),
    color: '#9CA3AF',
    marginTop: 8,
    fontStyle: 'italic',
  },
});