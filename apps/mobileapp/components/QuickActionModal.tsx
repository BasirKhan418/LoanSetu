// apps/mobileapp/components/QuickActionModal.tsx
import { database } from '@/database/schema';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { CheckCircle, Clock, FileText, X } from 'lucide-react-native';
import React from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface LoanDetails {
  _id: string;
  name: string;
  schemeName: string;
  schemeCode: string;
}

interface Loan {
  _id: string;
  loanNumber: string;
  loanDetailsId: LoanDetails;
  sanctionAmount: number;
  sanctionDate: string;
  verificationStatus: string;
  createdAt: string;
}

interface QuickActionModalProps {
  visible: boolean;
  onClose: () => void;
  loans: Loan[];
  title: string;
  actionType: 'newApplication' | 'trackStatus';
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  visible,
  onClose,
  loans,
  title,
  actionType,
}) => {
  const { user } = useAuth();

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return '#059669';
      case 'verified': return '#3B82F6';
      case 'submitted': return '#F59E0B';
      case 'pending': return '#6B7280';
      case 'disbursed': return '#10B981';
      case 'under review': return '#8B5CF6';
      case 'in process': return '#0EA5E9';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'verified':
      case 'disbursed':
        return CheckCircle;
      case 'submitted':
      case 'pending':
      case 'under review':
      case 'in process':
        return Clock;
      default:
        return Clock;
    }
  };

  // Find submission UUID for a loan
  const findSubmissionForLoan = async (loanId: string): Promise<string | null> => {
    const db = database.getDatabase();
    if (!db) return null;

    try {
      const submission = await db.getFirstAsync<{ localUuid: string }>(
        'SELECT localUuid FROM submissions WHERE loanId = ? ORDER BY createdAt DESC LIMIT 1',
        [loanId]
      );
      return submission?.localUuid || null;
    } catch (error) {
      console.error('Error finding submission:', error);
      return null;
    }
  };

  const handleLoanPress = async (loan: Loan) => {
    onClose();
    
    const status = loan.verificationStatus?.toLowerCase();
    
    // Only open submission-screen for pending or resubmission status
    if (status === 'pending' || status === 'need_resubmission') {
      router.push({
        pathname: '/submission-screen',
        params: {
          loanId: loan._id,
          loanReferenceId: loan.loanNumber,
          beneficiaryId: '', // Not available in modal, will be fetched in submission screen
          beneficiaryName: 'N/A',
          schemeName: loan.loanDetailsId?.name || loan.loanDetailsId?.schemeName || 'N/A',
          sanctionAmount: loan.sanctionAmount?.toString() || '0',
          sanctionDate: loan.sanctionDate || new Date().toISOString(),
          assetType: 'TRACTOR',
          tenantId: user?.tenantId || '',
        }
      });
    } else {
      // For approved/rejected/other statuses, show submission tracking page
      const submissionId = await findSubmissionForLoan(loan._id);
      if (submissionId) {
        router.push({
          pathname: '/submission-tracking',
          params: {
            submissionId: submissionId,
          }
        });
      } else {
        // No submission found, log warning
        console.log('No submission found for this loan');
      }
    }
  };

  const getEmptyStateText = () => {
    if (actionType === 'newApplication') {
      return 'No pending applications found';
    }
    return 'No applications to track';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#1F2937" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalScrollContent}
          >
            {loans.length === 0 ? (
              <View style={styles.emptyState}>
                <FileText size={48} color="#D1D5DB" strokeWidth={1.5} />
                <Text style={styles.emptyStateText}>{getEmptyStateText()}</Text>
                <Text style={styles.emptyStateSubtext}>
                  {actionType === 'newApplication' 
                    ? 'All your applications have been submitted' 
                    : 'Submit an application to track its status'}
                </Text>
              </View>
            ) : (
              <View style={styles.loansList}>
                {loans.map((loan) => {
                  const StatusIcon = getStatusIcon(loan.verificationStatus || 'pending');
                  return (
                    <TouchableOpacity
                      key={loan._id}
                      style={styles.loanCard}
                      activeOpacity={0.7}
                      onPress={() => handleLoanPress(loan)}
                    >
                      <View style={styles.loanHeader}>
                        <View style={styles.loanIconContainer}>
                          <FileText size={18} color="#FC8019" strokeWidth={2} />
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(loan.verificationStatus || 'pending')}15` }]}>
                          <StatusIcon size={12} color={getStatusColor(loan.verificationStatus || 'pending')} strokeWidth={2} />
                          <Text style={[styles.statusText, { color: getStatusColor(loan.verificationStatus || 'pending') }]}>
                            {(loan.verificationStatus || 'pending').toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      
                      <Text style={styles.loanScheme} numberOfLines={2}>
                        {loan.loanDetailsId.name}
                      </Text>
                      <Text style={styles.loanAmount}>
                        ₹{loan.sanctionAmount.toLocaleString('en-IN')}
                      </Text>
                      
                      <View style={styles.loanFooter}>
                        <Text style={styles.loanReference} numberOfLines={1}>
                          {loan.loanNumber}
                        </Text>
                        <Text style={styles.loanDate}>
                          {new Date(loan.sanctionDate).toLocaleDateString('en-IN')}
                        </Text>
                      </View>

                      {actionType === 'newApplication' && (
                        <View style={styles.actionButton}>
                          <Text style={styles.actionButtonText}>Submit Verification</Text>
                        </View>
                      )}
                      {actionType === 'trackStatus' && (
                        <View style={styles.actionButton}>
                          <Text style={styles.actionButtonText}>View Status</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '50%',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
  },
  loansList: {
    gap: 12,
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
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  loanIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FC8019',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  loanScheme: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
    lineHeight: 18,
  },
  loanAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FC8019',
    marginBottom: 10,
  },
  loanFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginBottom: 10,
  },
  loanReference: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  loanDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  actionButton: {
    backgroundColor: '#FC8019',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  emptyStateSubtext: {
    marginTop: 8,
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
