// apps/mobileapp/components/LoansModal.tsx
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

interface LoansModalProps {
  visible: boolean;
  onClose: () => void;
  loans: Loan[];
  title: string;
  type: 'all' | 'amount' | 'approved' | 'pending';
}

export const LoansModal: React.FC<LoansModalProps> = ({
  visible,
  onClose,
  loans,
  title,
  type,
}) => {
  const { user } = useAuth();

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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return '#059669';
      case 'verified': return '#3B82F6';
      case 'submitted': return '#F59E0B';
      case 'pending': return '#6B7280';
      case 'disbursed': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'verified':
        return CheckCircle;
      case 'submitted':
      case 'pending':
        return Clock;
      default:
        return Clock;
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
          beneficiaryId: '',
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
        console.log('No submission found for this loan');
      }
    }
  };

  const renderContent = () => {
    if (type === 'amount') {
      return (
        <View style={styles.amountList}>
          {loans.map((loan, index) => (
            <TouchableOpacity
              key={loan._id}
              style={styles.amountItem}
              activeOpacity={0.7}
              onPress={() => handleLoanPress(loan)}
            >
              <View style={styles.amountItemLeft}>
                <Text style={styles.amountItemNumber}>{index + 1}</Text>
                <View style={styles.amountItemDetails}>
                  <Text style={styles.amountItemName} numberOfLines={1}>
                    {loan.loanDetailsId.name}
                  </Text>
                  <Text style={styles.amountItemRef} numberOfLines={1}>
                    {loan.loanNumber}
                  </Text>
                </View>
              </View>
              <Text style={styles.amountItemValue}>
                ₹{loan.sanctionAmount.toLocaleString('en-IN')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    return (
      <View style={styles.loansList}>
        {loans.map((loan) => {
          const StatusIcon = getStatusIcon(loan.verificationStatus || 'pending');
          return (
            <TouchableOpacity
              key={loan._id}
              style={styles.modalLoanCard}
              activeOpacity={0.7}
              onPress={() => handleLoanPress(loan)}
            >
              <View style={styles.modalLoanHeader}>
                <View style={styles.modalLoanIconContainer}>
                  <FileText size={18} color="#FC8019" strokeWidth={2} />
                </View>
                <View style={[styles.modalStatusBadge, { backgroundColor: `${getStatusColor(loan.verificationStatus || 'pending')}15` }]}>
                  <StatusIcon size={12} color={getStatusColor(loan.verificationStatus || 'pending')} strokeWidth={2} />
                  <Text style={[styles.modalStatusText, { color: getStatusColor(loan.verificationStatus || 'pending') }]}>
                    {(loan.verificationStatus || 'pending').toUpperCase()}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.modalLoanScheme} numberOfLines={2}>
                {loan.loanDetailsId.name}
              </Text>
              <Text style={styles.modalLoanAmount}>
                ₹{loan.sanctionAmount.toLocaleString('en-IN')}
              </Text>
              
              <View style={styles.modalLoanFooter}>
                <Text style={styles.modalLoanReference} numberOfLines={1}>
                  {loan.loanNumber}
                </Text>
                <Text style={styles.modalLoanDate}>
                  {new Date(loan.sanctionDate).toLocaleDateString('en-IN')}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
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
                <Text style={styles.emptyStateText}>No Applications</Text>
                <Text style={styles.emptyStateSubtext}>No loans available in this category</Text>
              </View>
            ) : (
              renderContent()
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  modalLoanCard: {
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
  modalLoanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalLoanIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FC8019',
  },
  modalStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modalStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  modalLoanScheme: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
    lineHeight: 18,
  },
  modalLoanAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FC8019',
    marginBottom: 10,
  },
  modalLoanFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  modalLoanReference: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  modalLoanDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  amountList: {
    gap: 10,
  },
  amountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  amountItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 12,
  },
  amountItemNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FC801915',
    color: '#FC8019',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 28,
  },
  amountItemDetails: {
    flex: 1,
  },
  amountItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  amountItemRef: {
    fontSize: 11,
    color: '#6B7280',
  },
  amountItemValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FC8019',
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
  },
});
