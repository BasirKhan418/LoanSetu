import { LocationPopup } from '@/components/LocationPopup';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { router } from 'expo-router';
import { 
  FileText, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Search,
  HelpCircle,
} from 'lucide-react-native';
import React, { useEffect } from 'react';
import { 
  Dimensions,
  Image,
  Platform,
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

interface Loan {
  id: number;
  referenceId: string;
  schemeName: string;
  amount: string;
  status: 'pending' | 'submitted' | 'verified' | 'approved' | 'disbursed';
  appliedDate: string;
}

export default function DashboardScreen() {
  const { showLocationPopup, hasSetLocation } = useLocation();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // Show location popup on mount if location not set
  useEffect(() => {
    if (!hasSetLocation) {
      const timer = setTimeout(() => {
        showLocationPopup();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [hasSetLocation, showLocationPopup]);

  const tabBarHeight = Platform.OS === 'ios' 
    ? Math.max(80, 50 + insets.bottom) 
    : Math.max(70, 60 + insets.bottom);

  // Mock loan data
  const submittedLoans: Loan[] = [
    {
      id: 1,
      referenceId: '#SBI-AGRI-2023-8845',
      schemeName: 'Farm Mechanization Loan',
      amount: '₹2,50,000',
      status: 'verified',
      appliedDate: '15 Oct 2023'
    },
    {
      id: 2,
      referenceId: '#PNB-CROP-2023-7721',
      schemeName: 'Crop Insurance Scheme',
      amount: '₹1,80,000',
      status: 'submitted',
      appliedDate: '12 Nov 2023'
    },
    {
      id: 3,
      referenceId: '#HDFC-KCC-2023-9934',
      schemeName: 'Kisan Credit Card',
      amount: '₹5,00,000',
      status: 'approved',
      appliedDate: '5 Dec 2023'
    }
  ];

  const stats = {
    totalLoans: submittedLoans.length,
    totalAmount: '₹9,30,000',
    approved: submittedLoans.filter(l => l.status === 'approved').length,
    pending: submittedLoans.filter(l => l.status === 'pending' || l.status === 'submitted').length
  };

  const quickActions = [
    { id: 1, title: 'New Application', icon: Plus, color: '#FC8019', route: '/applications' },
    { id: 2, title: 'Track Status', icon: Search, color: '#FC8019', route: '/applications' },
    { id: 3, title: 'Help & Support', icon: HelpCircle, color: '#FC8019', route: '/profile' },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
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
              <Text style={styles.appName}>LoanSetu</Text>
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
            <Text style={styles.welcomeSubtitle}>Track and manage your loans</Text>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
        >
          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, styles.statCardPrimary]}>
              <View style={styles.statIconContainer}>
                <FileText size={24} color="#FC8019" strokeWidth={2.5} />
              </View>
              <Text style={styles.statValue}>{stats.totalLoans}</Text>
              <Text style={styles.statLabel}>Total Applications</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <TrendingUp size={24} color="#FC8019" strokeWidth={2.5} />
              </View>
              <Text style={styles.statValue}>{stats.totalAmount}</Text>
              <Text style={styles.statLabel}>Total Amount</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.miniStatCard, { borderLeftColor: '#FC8019' }]}>
              <CheckCircle size={20} color="#FC8019" strokeWidth={2} />
              <View style={styles.miniStatContent}>
                <Text style={styles.miniStatValue}>{stats.approved}</Text>
                <Text style={styles.miniStatLabel}>Approved</Text>
              </View>
            </View>

            <View style={[styles.miniStatCard, { borderLeftColor: '#F59E0B' }]}>
              <Clock size={20} color="#F59E0B" strokeWidth={2} />
              <View style={styles.miniStatContent}>
                <Text style={styles.miniStatValue}>{stats.pending}</Text>
                <Text style={styles.miniStatLabel}>Pending</Text>
              </View>
            </View>
          </View>

          {/* Submitted Loans */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Applications</Text>
              <TouchableOpacity onPress={() => router.push('/applications')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {submittedLoans.slice(0, 3).map((loan) => {
              const StatusIcon = getStatusIcon(loan.status);
              return (
                <TouchableOpacity
                  key={loan.id}
                  style={styles.loanCard}
                  activeOpacity={0.7}
                  onPress={() => router.push({
                    pathname: '/loan-verification',
                    params: {
                      loanId: loan.id.toString(),
                      schemeName: loan.schemeName,
                      amount: loan.amount,
                      referenceId: loan.referenceId,
                    }
                  })}
                >
                  <View style={styles.loanCardHeader}>
                    <View style={styles.loanIconContainer}>
                      <FileText size={20} color="#FC8019" strokeWidth={2} />
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(loan.status)}15` }]}>
                      <StatusIcon size={14} color={getStatusColor(loan.status)} strokeWidth={2} />
                      <Text style={[styles.statusText, { color: getStatusColor(loan.status) }]}>
                        {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.loanScheme}>{loan.schemeName}</Text>
                  <Text style={styles.loanAmount}>{loan.amount}</Text>
                  
                  <View style={styles.loanFooter}>
                    <Text style={styles.loanReference}>{loan.referenceId}</Text>
                    <Text style={styles.loanDate}>{loan.appliedDate}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
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
