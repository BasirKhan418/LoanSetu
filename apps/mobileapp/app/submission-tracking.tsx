// apps/mobileapp/app/submission-tracking.tsx
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, CheckCircle, Clock, AlertCircle, XCircle, FileText, Upload } from 'lucide-react-native';
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useAuth } from '@/contexts/AuthContext';
import { Submission, MediaFile, database } from '@/database/schema';
import { submissionService } from '@/services/submissionService';
import * as loansService from '@/api/loansService';

const { width } = Dimensions.get('window');
const scale = width / 375;

interface StatusStep {
  status: 'submitted' | 'in-review' | 'approved' | 'rejected';
  label: string;
  icon: React.ReactNode;
  timestamp?: string;
  notes?: string;
  completed: boolean;
  active: boolean;
}

type SubmissionWithMedia = Submission & { mediaFiles: MediaFile[] };

export default function SubmissionTrackingScreen() {
  const insets = useSafeAreaInsets();
  const { submissionId } = useLocalSearchParams<{ submissionId: string }>();
  const { isInitialized } = useDatabase();
  const { token } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  const timelineRef = useRef<View>(null);
  
  const [submission, setSubmission] = useState<SubmissionWithMedia | null>(null);
  const [loanStatus, setLoanStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load cached loan status from SQLite immediately
  const loadCachedLoanStatus = React.useCallback(async (loanId: string) => {
    const db = database.getDatabase();
    if (!db) return;

    try {
      const cachedLoan = await db.getFirstAsync<{ verificationStatus: string }>(
        'SELECT verificationStatus FROM loans WHERE loanId = ?',
        [loanId]
      );
      if (cachedLoan) {
        setLoanStatus(cachedLoan.verificationStatus || '');
      }
    } catch (error) {
      console.error('[Tracking] Error loading cached loan status:', error);
    }
  }, []);

  // Fetch fresh loan status from API in background
  const fetchFreshLoanStatus = React.useCallback(async (loanId: string) => {
    if (!token) return;

    try {
      const loanResponse = await loansService.getLoanById(loanId, token);
      if (loanResponse.success && loanResponse.data) {
        const status = loanResponse.data.verificationStatus || '';
        setLoanStatus(status);
        
        // Update SQLite cache
        const db = database.getDatabase();
        if (db) {
          await db.runAsync(
            'UPDATE loans SET verificationStatus = ?, updatedAt = ? WHERE loanId = ?',
            [status, new Date().toISOString(), loanId]
          );
        }
      }
    } catch (error) {
      console.error('[Tracking] Error fetching fresh loan status:', error);
    }
  }, [token]);

  const loadSubmission = React.useCallback(async () => {
    if (!submissionId || !isInitialized) return;

    try {
      // Load submission from SQLite immediately
      const data = await submissionService.getSubmissionByUuid(submissionId);
      setSubmission(data);
      setIsLoading(false);
      
      // Load cached loan status immediately for instant display
      if (data && data.loanId) {
        await loadCachedLoanStatus(data.loanId);
        
        // Fetch fresh status from API in background
        setIsRefreshing(true);
        fetchFreshLoanStatus(data.loanId).finally(() => setIsRefreshing(false));
      }
      
      // Auto-scroll to current status after a short delay
      setTimeout(() => {
        if (timelineRef.current) {
          timelineRef.current.measureLayout(
            scrollViewRef.current as any,
            (x, y) => {
              scrollViewRef.current?.scrollTo({ y: y - 100, animated: true });
            },
            () => {}
          );
        }
      }, 300);
    } catch (error) {
      console.error('[Tracking] Error loading submission:', error);
      setIsLoading(false);
    }
  }, [submissionId, isInitialized, loadCachedLoanStatus, fetchFreshLoanStatus]);

  useEffect(() => {
    loadSubmission();
  }, [loadSubmission]);

  const getStatusSteps = (): StatusStep[] => {
    const syncStatus = submission?.syncStatus || 'PENDING';
    const currentLoanStatus = loanStatus.toLowerCase();
    const createdAt = submission?.createdAt 
      ? new Date(submission.createdAt).toLocaleString()
      : undefined;
    const syncedAt = submission?.syncedAt
      ? new Date(submission.syncedAt).toLocaleString()
      : undefined;

    // Determine current step based on loan verification status
    const isInReview = syncStatus === 'SYNCED' && 
                       (currentLoanStatus === 'pending' || 
                        currentLoanStatus === 'in_review' || 
                        currentLoanStatus === 'need_resubmission');
    const isApproved = currentLoanStatus === 'approved';
    const isRejected = currentLoanStatus === 'rejected';

    const steps: StatusStep[] = [
      {
        status: 'submitted',
        label: 'Submitted',
        icon: <FileText size={24} color="#fff" />,
        timestamp: createdAt,
        notes: 'Application submitted successfully',
        completed: true,
        active: syncStatus === 'PENDING' && !loanStatus,
      },
      {
        status: 'in-review',
        label: 'In Review',
        icon: <Clock size={24} color="#fff" />,
        timestamp: syncedAt,
        notes: isInReview ? 'Under verification by authorities' : undefined,
        completed: isInReview || isApproved || isRejected,
        active: isInReview,
      },
      {
        status: 'approved',
        label: isApproved ? 'Approved' : isRejected ? 'Rejected' : syncStatus === 'FAILED' ? 'Failed' : 'Approved',
        icon: isRejected || syncStatus === 'FAILED'
          ? <XCircle size={24} color="#fff" />
          : <CheckCircle size={24} color="#fff" />,
        timestamp: isApproved || isRejected ? syncedAt : syncStatus === 'FAILED' ? syncedAt : undefined,
        notes: isApproved 
          ? 'Verification approved successfully'
          : isRejected
          ? 'Verification rejected'
          : syncStatus === 'FAILED'
          ? `Error: ${submission?.errorMessage || 'Sync failed'}`
          : undefined,
        completed: isApproved,
        active: isApproved,
      },
    ];

    // Add rejected step if loan is rejected
    if (isRejected) {
      steps[2] = {
        status: 'rejected',
        label: 'Rejected',
        icon: <XCircle size={24} color="#fff" />,
        timestamp: syncedAt,
        notes: 'Verification was rejected',
        completed: true,
        active: true,
      };
    }

    return steps;
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'SYNCED': return '#10b981';
      case 'PENDING': return '#f59e0b';
      case 'FAILED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'SYNCED': return <CheckCircle size={20} color="#10b981" />;
      case 'PENDING': return <Upload size={20} color="#f59e0b" />;
      case 'FAILED': return <XCircle size={20} color="#ef4444" />;
      default: return <Clock size={20} color="#6b7280" />;
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Loading submission details...</Text>
      </View>
    );
  }

  if (!submission) {
    return (
      <View style={[styles.container, styles.centered]}>
        <AlertCircle size={48} color="#ef4444" />
        <Text style={styles.errorText}>Submission not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const steps = getStatusSteps();
  const statusColor = getSyncStatusColor(submission.syncStatus);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submission Status</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView ref={scrollViewRef} style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Submission Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Loan Details</Text>
              {isRefreshing && (
                <Text style={styles.refreshingText}>Updating status...</Text>
              )}
            </View>
            <View style={styles.statusRow}>
              <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                {getSyncStatusIcon(submission.syncStatus)}
                <Text style={styles.statusBadgeText}>{submission.syncStatus}</Text>
              </View>
              {loanStatus && (
                <View style={[styles.verificationBadge, { 
                  backgroundColor: loanStatus.toLowerCase() === 'approved' ? '#D1FAE5' : 
                                   loanStatus.toLowerCase() === 'rejected' ? '#FEE2E2' :
                                   loanStatus.toLowerCase() === 'need_resubmission' ? '#FEF3C7' : '#E0E7FF'
                }]}>
                  <Text style={[styles.verificationBadgeText, {
                    color: loanStatus.toLowerCase() === 'approved' ? '#065f46' : 
                           loanStatus.toLowerCase() === 'rejected' ? '#991b1b' :
                           loanStatus.toLowerCase() === 'need_resubmission' ? '#92400e' : '#3730a3'
                  }]}>{loanStatus.toUpperCase()}</Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Loan ID:</Text>
            <Text style={styles.infoValue}>{submission.loanId}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Loan Reference:</Text>
            <Text style={styles.infoValue}>{submission.loanReferenceId || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Submitted:</Text>
            <Text style={styles.infoValue}>
              {new Date(submission.createdAt).toLocaleDateString()}
            </Text>
          </View>

          {submission.syncedAt && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last Synced:</Text>
              <Text style={styles.infoValue}>
                {new Date(submission.syncedAt).toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        {/* Status Timeline */}
        <View style={styles.card} ref={timelineRef}>
          <Text style={styles.cardTitle}>Status Timeline</Text>
          
          <View style={styles.timeline}>
            {steps.map((step, index) => (
              <View key={step.status} style={styles.timelineItem}>
                {/* Timeline Line */}
                {index < steps.length - 1 && (
                  <View
                    style={[
                      styles.timelineLine,
                      {
                        backgroundColor: step.completed ? '#10b981' : '#e5e7eb',
                      },
                    ]}
                  />
                )}

                {/* Step Icon */}
                <View
                  style={[
                    styles.timelineIcon,
                    {
                      backgroundColor: step.completed
                        ? '#10b981'
                        : step.active
                        ? '#f59e0b'
                        : '#e5e7eb',
                    },
                  ]}
                >
                  {step.icon}
                </View>

                {/* Step Content */}
                <View style={styles.timelineContent}>
                  <Text
                    style={[
                      styles.timelineLabel,
                      {
                        color: step.completed || step.active ? '#1f2937' : '#9ca3af',
                      },
                    ]}
                  >
                    {step.label}
                  </Text>
                  
                  {step.timestamp && (
                    <Text style={styles.timelineTimestamp}>{step.timestamp}</Text>
                  )}
                  
                  {step.notes && (
                    <Text
                      style={[
                        styles.timelineNotes,
                        submission.syncStatus === 'FAILED' && { color: '#ef4444' },
                      ]}
                    >
                      {step.notes}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Media Files */}
        {submission.mediaFiles && submission.mediaFiles.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Attachments</Text>
            <Text style={styles.mediaCount}>
              {submission.mediaFiles.filter(m => m.type === 'PHOTO').length} Photos, {' '}
              {submission.mediaFiles.filter(m => m.type === 'VIDEO').length} Videos
            </Text>
          </View>
        )}

        {/* Retry Button for Failed Submissions */}
        {submission.syncStatus === 'FAILED' && submission.id && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={async () => {
              try {
                await submissionService.markAsPending(submission.id);
                loadSubmission();
              } catch (error) {
                console.error('Error retrying sync:', error);
              }
            }}
          >
            <Upload size={20} color="#fff" />
            <Text style={styles.retryButtonText}>Retry Sync</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18 * scale,
    fontWeight: '600',
    color: '#1f2937',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16 * scale,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  refreshingText: {
    fontSize: 11 * scale,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12 * scale,
    fontWeight: '600',
  },
  verificationBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verificationBadgeText: {
    fontSize: 11 * scale,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 14 * scale,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14 * scale,
    color: '#1f2937',
    fontWeight: '500',
  },
  timeline: {
    marginTop: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 32,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 19,
    top: 40,
    width: 2,
    height: '100%',
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 4,
  },
  timelineLabel: {
    fontSize: 16 * scale,
    fontWeight: '600',
    marginBottom: 4,
  },
  timelineTimestamp: {
    fontSize: 12 * scale,
    color: '#6b7280',
    marginBottom: 4,
  },
  timelineNotes: {
    fontSize: 13 * scale,
    color: '#6b7280',
    marginTop: 4,
  },
  mediaCount: {
    fontSize: 14 * scale,
    color: '#6b7280',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16 * scale,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14 * scale,
    color: '#6b7280',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16 * scale,
    color: '#1f2937',
    fontWeight: '500',
  },
  backButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#10b981',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14 * scale,
    fontWeight: '600',
  },
});
