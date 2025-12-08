import { LocationPopup } from '@/components/LocationPopup';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from '@/contexts/LocationContext';
import { getTranslation } from '@/utils/translations';
import { router } from 'expo-router';
import * as loansService from '@/api/loansService';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  HelpCircle,
  Plus,
  Search,
  TrendingUp,
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

  // Show location popup on mount if location not set
  useEffect(() => {
    if (!hasSetLocation) {
      const timer = setTimeout(() => {
        showLocationPopup();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [hasSetLocation, showLocationPopup]);

  // Fetch loans from API
  const fetchLoans = async () => {
    if (!user?.phone) {
      return;
    }

    try {
      console.log('[Dashboard] Fetching loans for:', user.phone);
      const response = await loansService.getUserLoans(user.phone);
      
      if (response.success && response.data) {
        console.log('[Dashboard] Loans fetched:', response.data.length);
        setLoans(response.data);
      } else {
        console.error('[Dashboard] Failed to fetch loans:', response.message);
      }
    } catch (error) {
      console.error('[Dashboard] Error fetching loans:', error);
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

  // Get recent loans (last 3)
  const submittedLoans = loans.slice(0, 3);

  const quickActions = [
    { id: 1, title: getTranslation('newApplication', currentLanguage.code), icon: Plus, color: '#FC8019', route: '/applications' },
    { id: 2, title: getTranslation('trackStatus', currentLanguage.code), icon: Search, color: '#FC8019', route: '/applications' },
    { id: 3, title: getTranslation('helpSupport', currentLanguage.code), icon: HelpCircle, color: '#FC8019', route: '/profile' },
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
            <Text style={styles.greeting}>{getGreeting()}, {user?.name || 'User'}</Text>
            <Text style={styles.welcomeSubtitle}>{getTranslation('trackManageLoans', currentLanguage.code)}</Text>
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
            <View style={[styles.statCard, styles.statCardPrimary]}>
              <View style={styles.statIconContainer}>
                <FileText size={24} color="#FC8019" strokeWidth={2.5} />
              </View>
              <Text style={styles.statValue}>{stats.totalLoans}</Text>
              <Text style={styles.statLabel}>{getTranslation('totalApplications', currentLanguage.code)}</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <TrendingUp size={24} color="#FC8019" strokeWidth={2.5} />
              </View>
              <Text style={styles.statValue}>{stats.totalAmount}</Text>
              <Text style={styles.statLabel}>{getTranslation('totalAmount', currentLanguage.code)}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.miniStatCard, { borderLeftColor: '#FC8019' }]}>
              <CheckCircle size={20} color="#FC8019" strokeWidth={2} />
              <View style={styles.miniStatContent}>
                <Text style={styles.miniStatValue}>{stats.approved}</Text>
                <Text style={styles.miniStatLabel}>{getTranslation('approved', currentLanguage.code)}</Text>
              </View>
            </View>

            <View style={[styles.miniStatCard, { borderLeftColor: '#F59E0B' }]}>
              <Clock size={20} color="#F59E0B" strokeWidth={2} />
              <View style={styles.miniStatContent}>
                <Text style={styles.miniStatValue}>{stats.pending}</Text>
                <Text style={styles.miniStatLabel}>{getTranslation('pending', currentLanguage.code)}</Text>
              </View>
            </View>
          </View>

          {/* Submitted Loans */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{getTranslation('myApplications', currentLanguage.code)}</Text>
              <TouchableOpacity onPress={() => router.push('/applications')}>
                <Text style={styles.viewAllText}>{getTranslation('viewAll', currentLanguage.code)}</Text>
              </TouchableOpacity>
            </View>

          {submittedLoans.slice(0, 3).map((loan) => {
              const StatusIcon = getStatusIcon(loan.verificationStatus || 'pending');
              return (
                <TouchableOpacity
                  key={loan._id}
                  style={styles.loanCard}
                  activeOpacity={0.7}
                  onPress={() => router.push({
                    pathname: '/loan-verification',
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
                        {getTranslation(loan.verificationStatus || 'pending', currentLanguage.code)}
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
            })}
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
                    onPress={() => router.push(action.route as any)}
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
  }
});
