import type { Loan } from '@/api/loansService';
import * as loansService from '@/api/loansService';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Bell, Cloud, Globe, Trash2, Wifi, WifiOff } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
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
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { submissionService } from '../../services/submissionService';
import { syncService } from '../../services/syncservice';
import { getTranslation } from '../../utils/translations';

const { width, height } = Dimensions.get('window');
const scale = width / 375;

export default function ProfileScreen() {
  const { currentLanguage, availableLanguages, setLanguage } = useLanguage();
  const { user, logout, isOnline, refreshUserFromBackend } = useAuth();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoadingLoans, setIsLoadingLoans] = useState(true);
  const [showLoanStatus, setShowLoanStatus] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const insets = useSafeAreaInsets();
  const tabBarHeight = Platform.OS === 'ios' 
    ? Math.max(80, 50 + insets.bottom) 
    : Math.max(70, 60 + insets.bottom);
  
  // Offline-first: Load from SQLite first, then sync with API
  const fetchLoans = async () => {
    if (!user?.phone) {
      setIsLoadingLoans(false);
      return;
    }

    try {
      // 1. Load from cache immediately
      const { database } = await import('@/database/schema');
      const db = database.getDatabase();
      if (db) {
        const cached = await db.getAllAsync<any>(
          'SELECT * FROM loans ORDER BY sanctionDate DESC LIMIT 3'
        );
        if (cached.length > 0) {
          const cachedLoans = cached.map(loan => ({
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
            beneficiaryId: { _id: '', name: '', phone: '' },
            bankid: { _id: '', name: '', ifsc: '' },
            updatedAt: loan.updatedAt,
          }));
          setLoans(cachedLoans);
          console.log('[Profile] Loaded', cachedLoans.length, 'loans from cache');
        }
      }
      
      // 2. Sync with API if online
      if (isOnline) {
        console.log('[Profile] Syncing with API...');
        const response = await loansService.getUserLoans(user.phone);
        
        if (response.success && response.data) {
          console.log('[Profile] API sync successful');
          setLoans(response.data.slice(0, 3)); // Show top 3 loans
        }
      } else {
        console.log('[Profile] Offline - using cached data');
      }
    } catch (error) {
      console.error('[Profile] Error fetching loans:', error);
    } finally {
      setIsLoadingLoans(false);
    }
  };

  const fetchPendingCount = async () => {
    try {
      const count = await submissionService.countPendingSubmissions();
      setPendingCount(count);
    } catch (error) {
      console.error('[Profile] Error fetching pending count:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchLoans(),
      refreshUserFromBackend(),
      fetchPendingCount()
    ]);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchLoans();
    fetchPendingCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.phone]);

  const handleLanguageSelect = (language: any) => {
    setSelectedLanguage(language);
  };

  const handleLanguageConfirm = () => {
    if (selectedLanguage) {
      setLanguage(selectedLanguage);
      setShowLanguageModal(false);
    }
  };

  const handleLanguageCancel = () => {
    setSelectedLanguage(currentLanguage);
    setShowLanguageModal(false);
  };

  const handleLogout = () => {
    Alert.alert(
      getTranslation('logout', currentLanguage.code),
      getTranslation('logoutConfirm', currentLanguage.code),
      [
        { text: getTranslation('cancel', currentLanguage.code), style: 'cancel' },
        { 
          text: getTranslation('logout', currentLanguage.code), 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          }
        },
      ]
    );
  };

  const handleClearPendingSubmissions = async () => {
    try {
      // First, get the count of pending submissions
      const count = await submissionService.countPendingSubmissions();
      
      if (count === 0) {
        Alert.alert(
          'No Pending Data',
          'There are no pending submissions to clear.',
          [{ text: 'OK' }]
        );
        return;
      }

      Alert.alert(
        'Clear Pending Submissions',
        `Are you sure you want to delete ${count} pending submission(s)?\n\nThis will permanently remove all unsynced data including photos and videos. This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete All', 
            style: 'destructive',
            onPress: async () => {
              try {
                const deletedCount = await submissionService.deleteAllPendingSubmissions();
                Alert.alert(
                  'Success',
                  `Successfully deleted ${deletedCount} pending submission(s).`,
                  [{ text: 'OK' }]
                );
              } catch (error) {
                console.error('Error clearing pending submissions:', error);
                Alert.alert(
                  'Error',
                  'Failed to clear pending submissions. Please try again.',
                  [{ text: 'OK' }]
                );
              }
            }
          },
        ]
      );
    } catch (error) {
      console.error('Error checking pending submissions:', error);
      Alert.alert('Error', 'Failed to check pending submissions.', [{ text: 'OK' }]);
    }
  };

  const handleSyncData = async () => {
    if (!isOnline) {
      Alert.alert(
        'Offline',
        'Please connect to the internet to sync data.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (isSyncing) {
      return; // Already syncing, do nothing
    }

    try {
      setIsSyncing(true);
      console.log('[Profile] Triggering manual sync...');
      
      const result = await syncService.forceSyncNow();
      
      if (result.success) {
        if (result.syncedCount > 0) {
          Alert.alert(
            'Sync Complete',
            `Successfully synced ${result.syncedCount} submission(s).`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Already Synced',
            'All submissions are already synced.',
            [{ text: 'OK' }]
          );
        }
      } else {
        Alert.alert(
          'Sync Failed',
          result.errors.join('\n') || 'Failed to sync submissions.',
          [{ text: 'OK' }]
          );
      }

      // Refresh pending count after sync
      await fetchPendingCount();
      
      if (refreshUserFromBackend) {
        await refreshUserFromBackend();
      }
    } catch (error) {
      console.error('[Profile] Sync error:', error);
      Alert.alert(
        'Sync Error',
        'An error occurred while syncing. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSyncing(false);
    }
  };

  // Show loading or redirect if no user
  if (!user) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F5" />
      
      {/* Creative Header with User Profile */}
      <View style={[styles.creativeHeader, { backgroundColor: '#FC8019' }]}>
        <View style={styles.headerContent}>
          {/* Connection Status Indicator with Sync Button */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View style={styles.connectionStatus}>
              {isOnline ? (
                <Wifi size={16} color="#FFF" />
              ) : (
                <WifiOff size={16} color="#FFD700" />
              )}
              <Text style={styles.connectionText}>
                {isOnline ? getTranslation('online', currentLanguage.code) : getTranslation('offline', currentLanguage.code)}
              </Text>
            </View>

          </View>
          
          <View style={styles.profileCard}>
            <View style={styles.profilePictureContainer}>
              <Image 
                source={require('@/assets/pht.png')} 
                style={styles.profilePicture}
                resizeMode="cover"
              />
            </View>
            <View style={styles.userDetailsContainer}>
              <Text style={styles.userNameCreative}>{user.name || 'User'}</Text>
              <Text style={styles.userPhoneCreative}>{user.phone || 'N/A'}</Text>
              <View style={styles.userIdBadge}>
                <Text style={styles.userIdText}>ID: {user._id || 'N/A'}</Text>
              </View>
            </View>
          </View>
          <View style={styles.headerDecoration}>
            <View style={styles.decorativeCircle1} />
            <View style={styles.decorativeCircle2} />
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
        {/* Loan Information Cards - Horizontal Scroll */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{getTranslation('myLoans', currentLanguage.code)}</Text>
          {isLoadingLoans ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FC8019" />
              <Text style={styles.loadingText}>Loading loans...</Text>
            </View>
          ) : loans.length === 0 ? (
            <View style={styles.emptyLoansContainer}>
              <Text style={styles.emptyLoansText}>No loans found</Text>
              <Text style={styles.emptyLoansSubtext}>Your loan applications will appear here</Text>
            </View>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.loanCardsContainer}
              contentContainerStyle={styles.loanCardsContent}
            >
              {loans.map((loan) => {
                const formattedAmount = `₹${(loan.sanctionAmount || 0).toLocaleString('en-IN')}`;
                const formattedDate = new Date(loan.sanctionDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });
                
                return (
                  <TouchableOpacity 
                    key={loan._id} 
                    style={styles.loanCard}
                    onPress={() => {
                      router.push({
                        pathname: '/submission-screen',
                        params: {
                          loanId: loan._id,
                          schemeName: loan.loanDetailsId?.name || 'N/A',
                          amount: formattedAmount,
                          referenceId: loan.loanNumber,
                        }
                      });
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.loanCardHeader}>
                      <Text style={styles.loanStatus}>{loan.verificationStatus || 'Pending'}</Text>
                      <Text style={styles.loanAmount}>{formattedAmount}</Text>
                    </View>
                    <View style={styles.loanCardContent}>
                      <Text style={styles.loanLabel}>{getTranslation('referenceId', currentLanguage.code)}</Text>
                      <Text style={styles.loanValue}>{loan.loanNumber}</Text>
                      <Text style={styles.loanLabel}>{getTranslation('loanName', currentLanguage.code)}</Text>
                      <Text style={styles.loanSchemeName}>{loan.loanDetailsId?.name || 'N/A'}</Text>
                      <Text style={styles.loanLabel}>{getTranslation('sanctioned', currentLanguage.code)}</Text>
                      <Text style={styles.loanValue}>{formattedDate}</Text>
                    </View>
                    <View style={styles.tapIndicator}>
                      <Text style={styles.tapText}>{getTranslation('tapForDetails', currentLanguage.code)}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Data Sync Status Card */}
        <TouchableOpacity 
          style={styles.syncCard}
          onPress={handleSyncData}
          disabled={!isOnline || isSyncing}
          activeOpacity={0.7}
        >
          <View style={styles.syncCardContent}>
            <View style={styles.syncIcon}>
              {isSyncing ? (
                <ActivityIndicator size={Math.max(20, scale * 22)} color="#FF8C42" />
              ) : (
                <Cloud size={Math.max(20, scale * 22)} color="#FF8C42" strokeWidth={2} />
              )}
            </View>
            <View style={styles.syncTextContainer}>
              <Text style={styles.syncTitle}>
                {isSyncing ? 'Syncing...' : getTranslation('syncData', currentLanguage.code)}
              </Text>
              <Text style={styles.syncSubtitle}>
                {!isOnline 
                  ? 'Offline - Connect to sync'
                  : isSyncing
                  ? 'Please wait...'
                  : (pendingCount > 0) 
                  ? `${pendingCount} submission(s) pending upload`
                  : 'All data synced'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Menu Options */}
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuOption}
            onPress={() => setShowLanguageModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconContainer}>
              <Text style={styles.menuOptionIcon}>
                <Globe size={Math.max(20, scale * 22)} color="#FF8C42" strokeWidth={2} />
              </Text>
            </View>
            <Text style={styles.menuOptionText}>{getTranslation('languageSettings', currentLanguage.code)}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuOption}
            onPress={() => setNotificationsEnabled(!notificationsEnabled)}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconContainer}>
              <Bell size={Math.max(20, scale * 22)} color="#FF8C42" strokeWidth={2} />
            </View>
            <Text style={styles.menuOptionText}>{getTranslation('enableNotifications', currentLanguage.code)}</Text>
            <View style={[styles.toggleSwitch, notificationsEnabled && styles.toggleSwitchActive]}>
              <View style={[styles.toggleThumb, notificationsEnabled && styles.toggleThumbActive]} />
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Data Management Section */}
        <TouchableOpacity 
            style={styles.clearDataButton}
            onPress={handleClearPendingSubmissions}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconContainer}>
              <Trash2 size={Math.max(20, scale * 22)} color="#EF4444" strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.clearDataText}>Clear Pending Submissions</Text>
              <Text style={styles.clearDataSubtext}>Delete all unsynced data waiting to be uploaded</Text>
            </View>
          </TouchableOpacity>

        {/* Logout Section */}
        <View style={styles.logoutSection}>
          <TouchableOpacity onPress={handleLogout} activeOpacity={0.7}>
            <Text style={styles.logoutText}>{getTranslation('logout', currentLanguage.code)}</Text>
          </TouchableOpacity>
        </View>
        
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleLanguageCancel}
      >
        <LinearGradient
          colors={['#FFFFFF', '#FFF8F5', '#FFEDE0']}
          style={styles.modalContainer}
        >
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{getTranslation('selectLanguage', currentLanguage.code)}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleLanguageCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Language List */}
          <View style={styles.languageListContainer}>
            <FlatList
              data={availableLanguages}
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={false}
              style={styles.languageList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageItem,
                    selectedLanguage?.code === item.code && styles.selectedLanguageItem,
                  ]}
                  onPress={() => handleLanguageSelect(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.flag}>{item.flag}</Text>
                  <View style={styles.languageTextContainer}>
                    <Text style={styles.languageName}>{item.name}</Text>
                    <Text style={styles.languageNativeName}>{item.nativeName}</Text>
                  </View>
                  {selectedLanguage?.code === item.code && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>

          {/* Modal Buttons */}
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={handleLanguageCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>{getTranslation('cancel', currentLanguage.code)}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.confirmButton,
                !selectedLanguage && styles.buttonDisabled,
              ]}
              onPress={handleLanguageConfirm}
              disabled={!selectedLanguage}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>{getTranslation('continue', currentLanguage.code)}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Modal>

      {/* Loan Status Flow Modal */}
      <Modal
        visible={showLoanStatus}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLoanStatus(false)}
      >
        <View style={styles.compactStatusModal}>
          <View style={styles.compactModalHeader}>
            <View style={styles.modalHandleBar} />
            <View style={styles.compactHeaderContent}>
              <View style={styles.compactLoanInfo}>
                <Text style={styles.compactModalTitle}>
                  {selectedLoan?.loanDetailsId?.name || getTranslation('loanStatus', currentLanguage.code)}
                </Text>
                <Text style={styles.compactRefId}>{selectedLoan?.loanNumber}</Text>
                <Text style={styles.compactAmount}>₹{selectedLoan?.sanctionAmount?.toLocaleString('en-IN')}</Text>
              </View>
              <TouchableOpacity
                style={styles.compactCloseButton}
                onPress={() => setShowLoanStatus(false)}
              >
                <Text style={styles.compactCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.compactFlowContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.compactFlowTitle}>{getTranslation('loanStatus', currentLanguage.code)}</Text>
            <View style={styles.emptyLoansContainer}>
              <Text style={styles.emptyLoansText}>{getTranslation('statusTrackingComingSoon', currentLanguage.code)}</Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  creativeHeader: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 50,
    paddingBottom: Math.max(15, height * 0.02),
    paddingHorizontal: Math.max(20, width * 0.06),
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
    alignSelf: 'flex-end',
  },
  connectionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  headerContent: {
    position: 'relative',
  },
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: Math.max(16, scale * 20),
    padding: Math.max(16, scale * 20),
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  profileIconContainer: {
    width: Math.max(60, scale * 70),
    height: Math.max(60, scale * 70),
    borderRadius: Math.max(30, scale * 35),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Math.max(16, scale * 20),
    borderWidth: 1,
    borderColor: '#FF8C42',
  },
  profileIcon: {
    fontSize: Math.max(28, scale * 32),
  },
  profilePictureContainer: {
    position: 'relative',
    width: Math.max(80, scale * 90),
    height: Math.max(80, scale * 90),
    marginRight: Math.max(16, scale * 20),
  },
  profilePicture: {
    width: Math.max(80, scale * 90),
    height: Math.max(80, scale * 90),
    borderRadius: Math.max(40, scale * 45),
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  userDetailsContainer: {
    flex: 1,
  },
  userNameCreative: {
    fontSize: Math.max(20, scale * 24),
    fontWeight: '700',
    color: '#2C2C2C',
    marginBottom: Math.max(4, height * 0.005),
  },
  userPhoneCreative: {
    fontSize: Math.max(14, scale * 16),
    color: '#666666',
    marginBottom: Math.max(8, height * 0.01),
  },
  userIdBadge: {
    backgroundColor: '#FF8C42',
    paddingHorizontal: Math.max(8, scale * 10),
    paddingVertical: Math.max(4, scale * 6),
    borderRadius: Math.max(12, scale * 15),
    alignSelf: 'flex-start',
  },
  userIdText: {
    fontSize: Math.max(10, scale * 12),
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerDecoration: {
    position: 'absolute',
    top: -10,
    right: -10,
    zIndex: -1,
  },
  decorativeCircle1: {
    width: Math.max(80, scale * 100),
    height: Math.max(80, scale * 100),
    borderRadius: Math.max(40, scale * 50),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    position: 'absolute',
  },
  decorativeCircle2: {
    width: Math.max(40, scale * 50),
    height: Math.max(40, scale * 50),
    borderRadius: Math.max(20, scale * 25),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    position: 'absolute',
    top: 60,
    left: 40,
  },

  scrollContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Math.max(20, width * 0.06),
    paddingTop: Math.max(16, height * 0.02),
  },

  syncIcon: {
    width: Math.max(32, scale * 36),
    height: Math.max(32, scale * 36),
    borderRadius: Math.max(16, scale * 18),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF8C42',
  },
  syncIconText: {
    fontSize: Math.max(20, scale * 22),
  },
  menuOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: Math.max(8, scale * 10),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Math.max(12, scale * 16),
    paddingVertical: Math.max(10, scale * 12),
    marginBottom: Math.max(6, scale * 8),
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.15)',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  menuIconContainer: {
    width: Math.max(30, scale * 34),
    height: Math.max(30, scale * 34),
    borderRadius: Math.max(15, scale * 17),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Math.max(10, scale * 12),
    borderWidth: 1,
    borderColor: '#FF8C42',
  },
  menuOptionIcon: {
    fontSize: Math.max(20, scale * 22),
  },
  menuOptionText: {
    flex: 1,
    fontSize: Math.max(16, scale * 18),
    fontWeight: '500',
    color: '#2C2C2C',
  },
  menuArrow: {
    fontSize: Math.max(20, scale * 24),
    color: '#FF8C42',
    fontWeight: '600',
  },
  bottomSpacer: {
    minHeight: 40,
  },
  sectionContainer: {
    marginBottom: Math.max(16, height * 0.02),
  },
  sectionTitle: {
    fontSize: Math.max(18, scale * 20),
    fontWeight: '700',
    color: '#2C2C2C',
    marginBottom: Math.max(12, height * 0.015),
    paddingHorizontal: Math.max(4, scale * 6),
  },
  
  loanCardsContainer: {
    marginBottom: Math.max(8, height * 0.01),
  },
  loanCardsContent: {
  },
  loanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Math.max(12, scale * 14),
    marginRight: Math.max(12, scale * 16),
    padding: Math.max(12, scale * 16),
    width: Math.max(240, width * 0.64),
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.15)',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  loanCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Math.max(8, scale * 10),
  },
  loanStatus: {
    fontSize: Math.max(12, scale * 14),
    fontWeight: '600',
    color: '#FF8C42',
    backgroundColor: '#FFF8F5',
    paddingHorizontal: Math.max(8, scale * 10),
    paddingVertical: Math.max(2, scale * 4),
    borderRadius: Math.max(8, scale * 10),
  },
  loanAmount: {
    fontSize: Math.max(14, scale * 16),
    fontWeight: '700',
    color: '#2C2C2C',
  },
  loanCardContent: {
    gap: Math.max(6, scale * 8),
  },
  loanLabel: {
    fontSize: Math.max(11, scale * 12),
    color: '#666666',
    fontWeight: '500',
  },
  loanValue: {
    fontSize: Math.max(13, scale * 14),
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: Math.max(4, scale * 6),
  },
  loanSchemeName: {
    fontSize: Math.max(12, scale * 13),
    fontWeight: '500',
    color: '#666666',
    lineHeight: Math.max(16, scale * 18),
  },
  tapIndicator: {
    marginTop: Math.max(8, scale * 10),
    alignItems: 'center',
  },
  tapText: {
    fontSize: Math.max(10, scale * 11),
    color: '#FF8C42',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  syncCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Math.max(10, scale * 12),
    marginBottom: Math.max(12, height * 0.015),
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.15)',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  syncCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Math.max(12, scale * 16),
  },
  syncTextContainer: {
    flex: 1,
    marginLeft: Math.max(10, scale * 12),
  },
  syncTitle: {
    fontSize: Math.max(14, scale * 16),
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: Math.max(2, scale * 3),
  },
  syncSubtitle: {
    fontSize: Math.max(12, scale * 13),
    color: '#666666',
    lineHeight: Math.max(16, scale * 18),
  },
  menuSection: {
    marginBottom: Math.max(16, height * 0.02),
  },
  settingsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: Math.max(12, height * 0.015),
    marginHorizontal: Math.max(16, width * 0.04),
    marginBottom: Math.max(16, height * 0.02),
    padding: Math.max(16, width * 0.04),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  clearDataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Math.max(12, height * 0.015),
    paddingHorizontal: Math.max(12, width * 0.03),
    backgroundColor: '#FEF2F2',
    borderRadius: Math.max(10, height * 0.012),
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  clearDataText: {
    fontSize: Math.max(15, scale * 16),
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 2,
  },
  clearDataSubtext: {
    fontSize: Math.max(12, scale * 13),
    color: '#991B1B',
    lineHeight: 16,
  },
  logoutSection: {
    alignItems: 'center',
    marginTop: Math.max(8, height * 0.01),
    marginBottom: Math.max(16, height * 0.02),
  },
  logoutText: {
    fontSize: Math.max(16, scale * 18),
    fontWeight: '600',
    color: '#FF8C42',
    textDecorationLine: 'underline',
    textDecorationColor: '#FF8C42',
  },
  toggleSwitch: {
    width: Math.max(44, scale * 50),
    height: Math.max(24, scale * 28),
    borderRadius: Math.max(12, scale * 14),
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: '#FF8C42',
  },
  toggleThumb: {
    width: Math.max(20, scale * 24),
    height: Math.max(20, scale * 24),
    borderRadius: Math.max(10, scale * 12),
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: Math.max(20, scale * 22) }],
  },
  compactStatusModal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  compactModalHeader: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: Math.max(16, scale * 20),
    borderTopRightRadius: Math.max(16, scale * 20),
    paddingTop: Math.max(8, height * 0.01),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHandleBar: {
    width: Math.max(40, scale * 50),
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Math.max(12, height * 0.015),
  },
  compactHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Math.max(16, width * 0.05),
    paddingBottom: Math.max(12, height * 0.015),
  },
  compactLoanInfo: {
    flex: 1,
  },
  compactModalTitle: {
    fontSize: Math.max(16, scale * 18),
    fontWeight: '700',
    color: '#2C2C2C',
    marginBottom: Math.max(4, height * 0.005),
  },
  compactRefId: {
    fontSize: Math.max(12, scale * 14),
    fontWeight: '500',
    color: '#666666',
    marginBottom: Math.max(2, height * 0.003),
  },
  compactAmount: {
    fontSize: Math.max(18, scale * 20),
    fontWeight: '700',
    color: '#FF8C42',
  },
  compactCloseButton: {
    width: Math.max(28, scale * 32),
    height: Math.max(28, scale * 32),
    borderRadius: Math.max(14, scale * 16),
    backgroundColor: '#FFE4D6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactCloseText: {
    fontSize: Math.max(14, scale * 16),
    color: '#FF8C42',
    fontWeight: '600',
  },
  compactFlowContainer: {
    flex: 1,
    paddingHorizontal: Math.max(16, width * 0.05),
    backgroundColor: '#FAFAFA',
  },
  compactFlowTitle: {
    fontSize: Math.max(14, scale * 16),
    fontWeight: '600',
    color: '#2C2C2C',
    marginVertical: Math.max(12, height * 0.015),
    paddingHorizontal: Math.max(4, scale * 6),
  },
  compactStatusStep: {
    flexDirection: 'row',
    marginBottom: Math.max(12, height * 0.015),
    backgroundColor: '#FFFFFF',
    borderRadius: Math.max(8, scale * 10),
    padding: Math.max(10, scale * 12),
    marginHorizontal: Math.max(4, scale * 6),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  compactStepIndicator: {
    alignItems: 'center',
    marginRight: Math.max(12, scale * 16),
  },
  compactStepIcon: {
    width: Math.max(20, scale * 24),
    height: Math.max(20, scale * 24),
    borderRadius: Math.max(10, scale * 12),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  compactStepCompleted: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  compactStepActive: {
    backgroundColor: '#FF8C42',
    borderColor: '#FF8C42',
  },
  compactStepPending: {
    backgroundColor: '#F5F5F5',
    borderColor: '#CCCCCC',
  },
  compactStepIconText: {
    fontSize: Math.max(10, scale * 12),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  compactStepConnector: {
    width: 1.5,
    height: Math.max(20, height * 0.025),
    backgroundColor: '#E0E0E0',
    marginTop: Math.max(2, scale * 4),
  },
  compactStepContent: {
    flex: 1,
    paddingTop: Math.max(1, scale * 2),
  },
  compactStepTitle: {
    fontSize: Math.max(14, scale * 16),
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: Math.max(2, height * 0.003),
  },
  compactStepDate: {
    fontSize: Math.max(11, scale * 12),
    color: '#666666',
  },
  modalContainer: {
    flex: 1,
    paddingTop: (StatusBar.currentHeight || 0),
  },
  modalHeader: {
    alignItems: 'center',
    paddingBottom: Math.max(12, height * 0.015),
    paddingHorizontal: Math.max(24, width * 0.08),
  },
  closeButton: {
    position: 'absolute',
    right: Math.max(24, width * 0.08),
    width: Math.max(30, scale * 36),
    height: Math.max(30, scale * 36),
    borderRadius: Math.max(15, scale * 18),
    backgroundColor: '#FFE4D6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: Math.max(16, scale * 18),
    color: '#FF8C42',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: Math.max(20, scale * 24),
    fontWeight: '700',
    color: '#2C2C2C',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: Math.max(8, height * 0.01),
  },
  placeholder: {
    width: Math.max(30, scale * 36),
  },
  languageListContainer: {
    flex: 1,
    paddingHorizontal: Math.max(24, width * 0.08),
  },
  languageList: {
    paddingVertical: Math.max(16, height * 0.02),
  },
  languageItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: Math.max(10, scale * 12),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Math.max(12, scale * 16),
    paddingVertical: Math.max(12, scale * 14),
    marginBottom: Math.max(8, scale * 10),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedLanguageItem: {
    borderColor: '#FF8C42',
    borderWidth: 2,
    backgroundColor: '#FFF8F5',
    shadowOpacity: 0.15,
  },
  flag: {
    fontSize: Math.max(20, scale * 24),
    marginRight: Math.max(12, scale * 16),
  },
  languageTextContainer: {
    flex: 1,
  },
  languageName: {
    fontSize: Math.max(14, scale * 16),
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: Math.max(2, scale * 2),
  },
  languageNativeName: {
    fontSize: Math.max(12, scale * 14),
    color: '#666666',
    fontWeight: '400',
  },
  checkmark: {
    width: Math.max(20, scale * 24),
    height: Math.max(20, scale * 24),
    borderRadius: Math.max(10, scale * 12),
    backgroundColor: '#FF8C42',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: Math.max(12, scale * 14),
    fontWeight: '700',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    paddingHorizontal: Math.max(24, width * 0.08),
    paddingBottom: Math.max(24, height * 0.03),
    paddingTop: Math.max(8, height * 0.01),
    gap: Math.max(12, scale * 16),
  },
  modalButton: {
    flex: 1,
    borderRadius: Math.max(12, scale * 16),
    paddingVertical: Math.max(14, scale * 18),
    alignItems: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    shadowColor: '#000000',
  },
  confirmButton: {
    backgroundColor: '#FF8C42',
    shadowColor: '#FF8C42',
  },
  buttonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0.1,
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
  emptyLoansContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 12,
  },
  emptyLoansText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  emptyLoansSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  loanDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: Math.max(16, scale * 18),
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: Math.max(16, scale * 18),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  syncBadge: {
    backgroundColor: '#FF8C42',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },

});