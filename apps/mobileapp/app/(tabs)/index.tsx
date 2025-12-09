import * as loansService from '@/api/loansService';
import { LoansModal } from '@/components/LoansModal';
import { LocationPopup } from '@/components/LocationPopup';
import { QuickActionModal } from '@/components/QuickActionModal';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from '@/contexts/LocationContext';
import { database } from '@/database/schema';
import { getTranslation } from '@/utils/translations';
import NetInfo from '@react-native-community/netinfo';
import { router } from 'expo-router';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  HelpCircle,
  Plus,
  Search,
  TrendingUp,
  Wifi,
  WifiOff,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const scale = width / 375;

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

export default function DashboardScreen() {
  const { showLocationPopup, hasSetLocation } = useLocation();
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const insets = useSafeAreaInsets();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Modal states
  const [loansModalVisible, setLoansModalVisible] = useState(false);
  const [loansModalData, setLoansModalData] = useState<{
    loans: Loan[];
    title: string;
    type: 'all' | 'amount' | 'approved' | 'pending';
  }>({ loans: [], title: '', type: 'all' });

  const [quickActionModalVisible, setQuickActionModalVisible] = useState(false);
  const [quickActionModalData, setQuickActionModalData] = useState<{
    loans: Loan[];
    title: string;
    actionType: 'newApplication' | 'trackStatus';
  }>({ loans: [], title: '', actionType: 'newApplication' });

  // Show location popup on mount if location not set
  useEffect(() => {
    if (!hasSetLocation) {
      const timer = setTimeout(() => {
        showLocationPopup();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [hasSetLocation, showLocationPopup]);

  // Offline-first: Load from SQLite first, then sync with API
  const fetchLoans = async () => {
    if (!user?.phone) {
      return;
    }

    try {
      // 1. Load from SQLite immediately
      const cachedLoans = await loadCachedLoans();
      if (cachedLoans.length > 0) {
        setLoans(cachedLoans);
        console.log('[Dashboard] Loaded', cachedLoans.length, 'loans from cache');
      }
      
      // 2. Check network and sync
      const networkState = await NetInfo.fetch();
      const online = networkState.isConnected && networkState.isInternetReachable;
      setIsOnline(online || false);

      if (online) {
        // 3. Fetch from API to update cache
        console.log('[Dashboard] Syncing with API...');
        const response = await loansService.getUserLoans(user.phone);
        
        if (response.success && response.data) {
          console.log('[Dashboard] API sync successful:', response.data.length);
          setLoans(response.data);
          await cacheLoansInSQLite(response.data);
        }
      } else {
        console.log('[Dashboard] Offline - using cached data');
      }
    } catch (error) {
      console.error('[Dashboard] Error fetching loans:', error);
    }
  };

  // Cache loans in SQLite
  const cacheLoansInSQLite = async (loansData: Loan[]) => {
    const db = database.getDatabase();
    if (!db || !user) return;

    try {
      for (const loan of loansData) {
        const now = new Date().toISOString();
        const existing = await db.getFirstAsync<{ id: number }>(
          'SELECT id FROM loans WHERE loanId = ?',
          [loan._id]
        );

        if (existing) {
          await db.runAsync(
            `UPDATE loans SET beneficiaryName = ?, loanReferenceId = ?,
             schemeName = ?, sanctionAmount = ?, sanctionDate = ?,
             verificationStatus = ?, updatedAt = ? WHERE loanId = ?`,
            ['N/A', loan.loanNumber, loan.loanDetailsId?.name || 'N/A',
             loan.sanctionAmount, loan.sanctionDate, loan.verificationStatus || 'pending',
             now, loan._id]
          );
        } else {
          await db.runAsync(
            `INSERT INTO loans (loanId, beneficiaryId, beneficiaryName, loanReferenceId,
             schemeName, sanctionAmount, sanctionDate, assetType, tenantId,
             verificationStatus, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [loan._id, 'N/A', 'N/A', loan.loanNumber, loan.loanDetailsId?.name || 'N/A',
             loan.sanctionAmount, loan.sanctionDate, 'TRACTOR', user.tenantId || '',
             loan.verificationStatus || 'pending', now, now]
          );
        }
      }
    } catch (error) {
      console.error('[Dashboard] Error caching loans:', error);
    }
  };

  // Load loans from SQLite cache
  const loadCachedLoans = async (): Promise<Loan[]> => {
    const db = database.getDatabase();
    if (!db) return [];

    try {
      const cached = await db.getAllAsync<any>(
        'SELECT * FROM loans ORDER BY sanctionDate DESC'
      );

      return cached.map(loan => ({
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
        createdAt: loan.createdAt,
      }));
    } catch (error) {
      console.error('[Dashboard] Error loading cached loans:', error);
      return [];
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLoans();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchLoans();
    
    // Listen for network changes
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected && state.isInternetReachable;
      setIsOnline(online || false);
      console.log('[Dashboard] Network status:', online ? 'Online' : 'Offline');
    });
    
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.phone]);

  const tabBarHeight = Platform.OS === 'ios' 
    ? Math.max(80, 50 + insets.bottom) 
    : Math.max(70, 60 + insets.bottom);

  // Calculate stats from real data
  const stats = {
    totalLoans: loans.length,
    totalAmount: loans.length > 0 
      ? `₹${loans.reduce((sum, loan) => sum + (loan.sanctionAmount || 0), 0).toLocaleString('en-IN')}`
      : '₹0',
    approved: loans.filter(l => l.verificationStatus?.toLowerCase() === 'approved').length,
    pending: loans.filter(l => l.verificationStatus?.toLowerCase() === 'pending' || l.verificationStatus?.toLowerCase() === 'submitted').length
  };

  // Get recent submissions (not pending) - sorted by most recent
  const recentSubmissions = loans
    .filter(l => {
      const status = l.verificationStatus?.toLowerCase();
      return status !== 'pending' && status !== 'submitted';
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  // Get pending applications
  const pendingApplications = loans.filter(l => {
    const status = l.verificationStatus?.toLowerCase();
    return status === 'pending' || status === 'submitted';
  });

  // Get applications for tracking (all except pending)
  const trackableApplications = loans.filter(l => {
    const status = l.verificationStatus?.toLowerCase();
    return status !== 'pending' && status !== 'submitted';
  });

  // Handle modal opens
  const handleOpenLoansModal = (type: 'all' | 'amount' | 'approved' | 'pending', title: string, filteredLoans: Loan[]) => {
    setLoansModalData({ loans: filteredLoans, title, type });
    setLoansModalVisible(true);
  };

  const handleOpenQuickActionModal = (actionType: 'newApplication' | 'trackStatus', title: string, filteredLoans: Loan[]) => {
    setQuickActionModalData({ loans: filteredLoans, title, actionType });
    setQuickActionModalVisible(true);
  };

  const quickActions = [
    { 
      id: 1, 
      title: getTranslation('newApplication', currentLanguage.code), 
      icon: Plus, 
      color: '#FC8019', 
      onPress: () => handleOpenQuickActionModal('newApplication', 'New Applications', pendingApplications)
    },
    { 
      id: 2, 
      title: getTranslation('trackStatus', currentLanguage.code), 
      icon: Search, 
      color: '#FC8019', 
      onPress: () => handleOpenQuickActionModal('trackStatus', 'Track Status', trackableApplications)
    },
    { 
      id: 3, 
      title: getTranslation('helpSupport', currentLanguage.code), 
      icon: HelpCircle, 
      color: '#FC8019', 
      onPress: () => router.push('/profile')
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return getTranslation('goodMorning', currentLanguage.code);
    if (hour < 17) return getTranslation('goodAfternoon', currentLanguage.code);
    return getTranslation('goodEvening', currentLanguage.code);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#059669';
      case 'verified': return '#3B82F6';
      case 'submitted': return '#F59E0B';
      case 'pending': return '#6B7280';
      case 'disbursed': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'verified':
        return CheckCircle;
      case 'submitted':
      case 'pending':
        return Clock;
      default:
        return AlertCircle;
    }
  };

  return (
    <>
      <LocationPopup />
      
      {/* Modals */}
      <LoansModal
        visible={loansModalVisible}
        onClose={() => setLoansModalVisible(false)}
        loans={loansModalData.loans}
        title={loansModalData.title}
        type={loansModalData.type}
      />

      <QuickActionModal
        visible={quickActionModalVisible}
        onClose={() => setQuickActionModalVisible(false)}
        loans={quickActionModalData.loans}
        title={quickActionModalData.title}
        actionType={quickActionModalData.actionType}
      />

      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerTop}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Image 
                  source={require('@/assets/icon.png')} 
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.appName}>{getTranslation('appName', currentLanguage.code)}</Text>
            </View>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => router.push('/profile')}
            >
              <View style={styles.profileCircle}>
                <Image 
                  source={require('@/assets/pht.png')} 
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.welcomeSection}>
            <View style={styles.greetingRow}>
              <View style={styles.greetingContent}>
                <Text style={styles.greeting}>{getGreeting()}, {user?.name || 'User'}</Text>
                <Text style={styles.welcomeSubtitle}>{getTranslation('trackManageLoans', currentLanguage.code)}</Text>
              </View>
              {/* Online/Offline Indicator */}
              <View style={[styles.onlineIndicator, !isOnline && styles.offlineIndicator]}>
                {isOnline ? (
                  <Wifi size={14} color="#10b981" strokeWidth={2.5} />
                ) : (
                  <WifiOff size={14} color="#ef4444" strokeWidth={2.5} />
                )}
                <Text style={[styles.onlineText, !isOnline && styles.offlineText]}>
                  {isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>
          </View>
        </View>

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
          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <TouchableOpacity 
              style={[styles.statCard, styles.statCardPrimary]}
              activeOpacity={0.7}
              onPress={() => handleOpenLoansModal('all', getTranslation('totalApplications', currentLanguage.code), loans)}
            >
              <View style={styles.statIconContainer}>
                <FileText size={24} color="#FC8019" strokeWidth={2.5} />
              </View>
              <Text style={styles.statValue}>{stats.totalLoans}</Text>
              <Text style={styles.statLabel}>{getTranslation('totalApplications', currentLanguage.code)}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.statCard}
              activeOpacity={0.7}
              onPress={() => handleOpenLoansModal('amount', getTranslation('totalAmount', currentLanguage.code), loans)}
            >
              <View style={styles.statIconContainer}>
                <TrendingUp size={24} color="#FC8019" strokeWidth={2.5} />
              </View>
              <Text style={styles.statValue}>{stats.totalAmount}</Text>
              <Text style={styles.statLabel}>{getTranslation('totalAmount', currentLanguage.code)}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <TouchableOpacity 
              style={[styles.miniStatCard, { borderLeftColor: '#FC8019' }]}
              activeOpacity={0.7}
              onPress={() => handleOpenLoansModal('approved', getTranslation('approved', currentLanguage.code), loans.filter(l => l.verificationStatus?.toLowerCase() === 'approved'))}
            >
              <CheckCircle size={20} color="#FC8019" strokeWidth={2} />
              <View style={styles.miniStatContent}>
                <Text style={styles.miniStatValue}>{stats.approved}</Text>
                <Text style={styles.miniStatLabel}>{getTranslation('approved', currentLanguage.code)}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.miniStatCard, { borderLeftColor: '#F59E0B' }]}
              activeOpacity={0.7}
              onPress={() => handleOpenLoansModal('pending', getTranslation('pending', currentLanguage.code), loans.filter(l => {
                const status = l.verificationStatus?.toLowerCase();
                return status === 'pending' || status === 'submitted';
              }))}
            >
              <Clock size={20} color="#F59E0B" strokeWidth={2} />
              <View style={styles.miniStatContent}>
                <Text style={styles.miniStatValue}>{stats.pending}</Text>
                <Text style={styles.miniStatLabel}>{getTranslation('pending', currentLanguage.code)}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{getTranslation('quickActions', currentLanguage.code)}</Text>
            <View style={styles.actionsGrid}>
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <TouchableOpacity
                    key={action.id}
                    style={styles.actionCard}
                    activeOpacity={0.7}
                    onPress={action.onPress}
                  >
                    <View style={[styles.actionIconContainer]}>
                      <Icon size={24} color={action.color} strokeWidth={2} />
                    </View>
                    <Text style={styles.actionTitle}>{action.title}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Recent Submissions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Submissions</Text>
              <TouchableOpacity onPress={() => router.push('/applications')}>
                <Text style={styles.viewAllText}>{getTranslation('viewAll', currentLanguage.code)}</Text>
              </TouchableOpacity>
            </View>

            {recentSubmissions.length === 0 ? (
              <View style={styles.emptyCard}>
                <FileText size={32} color="#D1D5DB" strokeWidth={1.5} />
                <Text style={styles.emptyText}>No recent submissions</Text>
                <Text style={styles.emptySubtext}>Submit an application to see it here</Text>
              </View>
            ) : (
              recentSubmissions.map((loan) => {
                const StatusIcon = getStatusIcon(loan.verificationStatus || 'pending');
                return (
                  <TouchableOpacity
                    key={loan._id}
                    style={styles.loanCard}
                    activeOpacity={0.7}
                    onPress={() => router.push({
                      pathname: '/submission-tracking',
                      params: {
                        loanId: loan._id.toString(),
                        schemeName: loan.loanDetailsId.schemeName,
                        amount: loan.sanctionAmount.toString(),
                        referenceId: loan.loanNumber,
                      }
                    })}
                  >
                    <View style={styles.loanCardHeader}>
                      <View style={styles.loanIconContainer}>
                        <FileText size={20} color="#FC8019" strokeWidth={2} />
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(loan.verificationStatus || 'pending')}15` }]}>
                        <StatusIcon size={14} color={getStatusColor(loan.verificationStatus || 'pending')} strokeWidth={2} />
                        <Text style={[styles.statusText, { color: getStatusColor(loan.verificationStatus || 'pending') }]}>
                          {getTranslation((loan.verificationStatus || 'pending').toLowerCase(), currentLanguage.code)}
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={styles.loanScheme}>{loan.loanDetailsId.name}</Text>
                    <Text style={styles.loanAmount}>₹{loan.sanctionAmount.toLocaleString('en-IN')}</Text>
                    
                    <View style={styles.loanFooter}>
                      <Text style={styles.loanReference}>{loan.loanNumber}</Text>
                      <Text style={styles.loanDate}>{new Date(loan.sanctionDate).toLocaleDateString('en-IN')}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 36,
    height: 36,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  profileButton: {
    padding: 4,
  },
  profileCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FC8019',
    overflow: 'hidden',
  },
  profileImage: {
    width: 42,
    height: 42,
  },
  welcomeSection: {
    marginBottom: 4,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  greetingContent: {
    flex: 1,
  },
  greeting: {
    fontSize: Math.max(18, scale * 20),
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: Math.max(13, scale * 14),
    color: '#6B7280',
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  offlineIndicator: {
    backgroundColor: '#FEE2E2',
    borderColor: '#ef4444',
  },
  onlineText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10b981',
  },
  offlineText: {
    color: '#ef4444',
  },
  scrollContent: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statCardPrimary: {
    borderWidth: 1,
    borderColor: '#FFE5D3',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FC8019',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  miniStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  miniStatContent: {
    flex: 1,
  },
  miniStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  miniStatLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FC8019',
  },
  loanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  loanCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  loanIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF8C42',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loanScheme: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
    lineHeight: 22,
  },
  loanAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FC8019',
    marginBottom: 12,
  },
  loanFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  loanReference: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  loanDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
    actionIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  emptyStateSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  actionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 14,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 13,
    color: '#9CA3AF',
  },
});
