import type { Loan } from '@/api/loansService';
import * as loansService from '@/api/loansService';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { database } from '@/database/schema';
import { getTranslation } from '@/utils/translations';
import NetInfo from '@react-native-community/netinfo';
import { router } from 'expo-router';
import { ChevronRight, FileText, Search, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const scale = width / 375;

export default function ApplicationsScreen() {
  const insets = useSafeAreaInsets();
  const { currentLanguage } = useLanguage();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const tabBarHeight = Platform.OS === 'ios' 
    ? Math.max(80, 50 + insets.bottom) 
    : Math.max(70, 60 + insets.bottom);


  // Offline-first: Load from SQLite first, then sync with API
  const fetchLoans = async () => {
    if (!user?.phone) {
      setIsLoading(false);
      return;
    }

    try {
      // 1. Load from SQLite immediately (offline-first)
      console.log('[Applications] Loading loans from cache...');
      await loadCachedLoans();
      
      // 2. Check if we're online
      const networkState = await NetInfo.fetch();
      const isOnline = networkState.isConnected && networkState.isInternetReachable;

      if (isOnline) {
        // 3. Fetch from API to get latest data (background update)
        console.log('[Applications] Online - syncing with API...');
        try {
          const response = await loansService.getUserLoans(user.phone);
          
          if (response.success && response.data) {
            console.log('[Applications] API sync successful:', response.data.length);
            setLoans(response.data);
            
            // 4. Update SQLite cache
            await cacheLoansInSQLite(response.data);
          } else {
            console.warn('[Applications] API sync failed, using cached data');
          }
        } catch (apiError) {
          console.warn('[Applications] API error, using cached data:', apiError);
        }
      } else {
        console.log('[Applications] Offline - using cached data');
      }
    } catch (error) {
      console.error('[Applications] Error in fetchLoans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cache loans in SQLite (single entry per loan)
  const cacheLoansInSQLite = async (loansData: Loan[]) => {
    const db = database.getDatabase();
    if (!db || !user) return;

    try {
      for (const loan of loansData) {
        const now = new Date().toISOString();
        
        // Check if loan already exists
        const existing = await db.getFirstAsync<{ id: number }>(
          'SELECT id FROM loans WHERE loanId = ?',
          [loan._id]
        );

        if (existing) {
          // Update existing loan
          await db.runAsync(
            `UPDATE loans SET 
              beneficiaryName = ?,
              loanReferenceId = ?,
              schemeName = ?,
              sanctionAmount = ?,
              sanctionDate = ?,
              verificationStatus = ?,
              updatedAt = ?
            WHERE loanId = ?`,
            [
              loan.beneficiaryId?.name || 'N/A',
              loan.loanNumber,
              loan.loanDetailsId?.name || 'N/A',
              loan.sanctionAmount,
              loan.sanctionDate,
              loan.verificationStatus || 'pending',
              now,
              loan._id,
            ]
          );
        } else {
          // Insert new loan
          await db.runAsync(
            `INSERT INTO loans (
              loanId, beneficiaryId, beneficiaryName, loanReferenceId,
              schemeName, sanctionAmount, sanctionDate, assetType,
              tenantId, verificationStatus, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              loan._id,
              loan.beneficiaryId?._id || '',
              loan.beneficiaryId?.name || 'N/A',
              loan.loanNumber,
              loan.loanDetailsId?.name || 'N/A',
              loan.sanctionAmount,
              loan.sanctionDate,
              'TRACTOR',
              user.tenantId || '',
              loan.verificationStatus || 'pending',
              now,
              now,
            ]
          );
        }
      }
      console.log('[Applications] Loans cached in SQLite');
    } catch (error) {
      console.error('[Applications] Error caching loans:', error);
    }
  };

  // Load loans from SQLite cache
  const loadCachedLoans = async () => {
    const db = database.getDatabase();
    if (!db) return;

    try {
      const cachedLoans = await db.getAllAsync<any>(
        'SELECT * FROM loans ORDER BY sanctionDate DESC'
      );

      if (cachedLoans.length > 0) {
        // Transform SQLite data to Loan format
        const transformedLoans: Loan[] = cachedLoans.map(loan => ({
          _id: loan.loanId,
          loanNumber: loan.loanReferenceId,
          loanDetailsId: {
            _id: '',
            name: loan.schemeName,
            schemeName: loan.schemeName,
            schemeCode: '',
          },
          sanctionAmount: loan.sanctionAmount,
          sanctionDate: loan.sanctionDate,
          verificationStatus: loan.verificationStatus || 'pending',
          beneficiaryId: {
            _id: loan.beneficiaryId,
            name: loan.beneficiaryName,
            phone: '',
          },
          bankid: {
            _id: '',
            name: '',
            ifsc: '',
          },
          createdAt: loan.createdAt,
          updatedAt: loan.updatedAt,
        }));

        setLoans(transformedLoans);
        console.log('[Applications] Loaded', transformedLoans.length, 'cached loans');
      } else {
        console.log('[Applications] No cached loans found');
      }
    } catch (error) {
      console.error('[Applications] Error loading cached loans:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLoans();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchLoans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.phone]);

  const filteredLoans = loans.filter(loan =>
    loan.loanDetailsId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loan.loanDetailsId?.schemeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loan.loanNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLoanPress = (loan: Loan) => {
    const status = loan.verificationStatus?.toLowerCase();
    
    // Only open submission-screen for pending or resubmission status
    if (status === 'pending' || status === 'need_resubmission') {
      router.push({
        pathname: '/submission-screen',
        params: {
          loanId: loan._id,
          loanReferenceId: loan.loanNumber,
          beneficiaryId: loan.beneficiaryId?._id || '',
          beneficiaryName: loan.beneficiaryId?.name || 'N/A',
          schemeName: loan.loanDetailsId?.name || 'N/A',
          sanctionAmount: loan.sanctionAmount?.toString() || '0',
          sanctionDate: loan.sanctionDate || new Date().toISOString(),
          assetType: 'TRACTOR',
          tenantId: user?.tenantId || '',
        }
      });
    } else {
      // For approved/rejected/other statuses, show submission tracking page
      // Find submission by loanId to get the localUuid
      findSubmissionForLoan(loan._id).then(submissionId => {
        if (submissionId) {
          router.push({
            pathname: '/submission-tracking',
            params: {
              submissionId: submissionId,
            }
          });
        } else {
          // No submission found, show alert
          console.log('No submission found for this loan');
        }
      });
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Simple Header with just space for status bar */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>{getTranslation('myApprovedLoans', currentLanguage.code)}</Text>
            <Text style={styles.headerSubtitle}>{filteredLoans.length} {getTranslation('loansAvailable', currentLanguage.code)}</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color="#9CA3AF" strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder={getTranslation('searchByLoanName', currentLanguage.code)}
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color="#9CA3AF" strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Loans List */}
      <ScrollView 
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FC8019']}
            tintColor="#FC8019"
          />
        }
      >
        <View style={styles.loansContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FC8019" />
              <Text style={styles.loadingText}>Loading loans...</Text>
            </View>
          ) : filteredLoans.length === 0 ? (
            <View style={styles.emptyState}>
              <FileText size={48} color="#D1D5DB" strokeWidth={1.5} />
              <Text style={styles.emptyStateText}>{getTranslation('noLoansFound', currentLanguage.code)}</Text>
              <Text style={styles.emptyStateSubtext}>{searchQuery ? getTranslation('tryAdjustingSearch', currentLanguage.code) : 'Your loan applications will appear here'}</Text>
            </View>
          ) : (
            filteredLoans.map((loan) => {
              const formattedDate = new Date(loan.sanctionDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              });
              const formattedAmount = `₹${(loan.sanctionAmount || 0).toLocaleString('en-IN')}`;
              
              const status = loan.verificationStatus?.toLowerCase() || 'pending';
              const getStatusBadge = () => {
                switch (status) {
                  case 'approved':
                    return { text: 'Approved', bgColor: '#D1FAE5', textColor: '#065f46' };
                  case 'rejected':
                    return { text: 'Rejected', bgColor: '#FEE2E2', textColor: '#991b1b' };
                  case 'need_resubmission':
                    return { text: 'Resubmit', bgColor: '#FEF3C7', textColor: '#92400e' };
                  case 'pending':
                  default:
                    return { text: 'Pending', bgColor: '#E0E7FF', textColor: '#3730a3' };
                }
              };
              
              const statusBadge = getStatusBadge();
              const isDisabled = status === 'approved' || status === 'rejected';
              
              return (
                <TouchableOpacity
                  key={loan._id}
                  style={[
                    styles.loanCard,
                    isDisabled && styles.loanCardDisabled
                  ]}
                  activeOpacity={isDisabled ? 1 : 0.7}
                  onPress={() => !isDisabled && handleLoanPress(loan)}
                  disabled={isDisabled}
                >
                  <View style={styles.loanCardContent}>
                    <View style={styles.loanIcon}>
                      <FileText size={24} color={isDisabled ? '#9CA3AF' : '#FC8019'} strokeWidth={2} />
                    </View>
                    <View style={styles.loanInfo}>
                      <View style={styles.loanHeader}>
                        <Text style={[styles.loanName, isDisabled && styles.textDisabled]}>
                          {loan.loanDetailsId?.name || 'N/A'}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusBadge.bgColor }]}>
                          <Text style={[styles.statusBadgeText, { color: statusBadge.textColor }]}>
                            {statusBadge.text}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.loanAmount, isDisabled && styles.textDisabled]}>{formattedAmount}</Text>
                      <Text style={[styles.loanDate, isDisabled && styles.textDisabled]}>{loan.loanNumber} • {formattedDate}</Text>
                    </View>
                  </View>
                  {!isDisabled && <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />}
                </TouchableOpacity>
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 10,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Math.max(24, scale * 26),
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: Math.max(13, scale * 14),
    color: '#6B7280',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: Math.max(15, scale * 16),
    color: '#1F2937',
    marginLeft: 12,
    marginRight: 8,
  },
  scrollContent: {
    flex: 1,
  },
  loansContainer: {
    padding: 16,
  },
  loanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  loanCardDisabled: {
    opacity: 0.6,
    backgroundColor: '#F9FAFB',
  },
  loanCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  loanIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#FF8C42',
  },
  loanInfo: {
    flex: 1,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  loanName: {
    fontSize: Math.max(15, scale * 16),
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 20,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: Math.max(10, scale * 11),
    fontWeight: '600',
  },
  textDisabled: {
    color: '#9CA3AF',
  },
  loanAmount: {
    fontSize: Math.max(18, scale * 20),
    fontWeight: 'bold',
    color: '#FC8019',
    marginBottom: 2,
  },
  loanDate: {
    fontSize: Math.max(11, scale * 12),
    color: '#9CA3AF',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: Math.max(16, scale * 18),
    fontWeight: '600',
    color: '#374151',
  },
  emptyStateSubtext: {
    marginTop: 8,
    fontSize: Math.max(14, scale * 15),
    color: '#6B7280',
  },
});
