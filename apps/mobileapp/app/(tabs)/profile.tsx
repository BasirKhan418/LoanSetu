import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';
import { Bell } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');
const scale = width / 375;

// Define types for loan data
interface StatusStep {
  step: string;
  status: 'completed' | 'active' | 'pending';
  date: string;
}

interface Loan {
  id: number;
  referenceId: string;
  schemeName: string;
  status: string;
  amount: string;
  statusFlow: StatusStep[];
}

export default function ProfileScreen() {
  const { currentLanguage, availableLanguages, setLanguage } = useLanguage();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [showLoanStatus, setShowLoanStatus] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Mock user data for testing
  const user = {
    name: 'Swagat Kumar Dash',
    mobile: '+91 9556376455',
    userId: 'USER123456',
    joinDate: 'Jan 2024'
  };

  // Mock multiple loans data with detailed status flow
  const mockLoans = [
    {
      id: 1,
      referenceId: '#SBI-AGRI-2023-8845',
      schemeName: 'Farm Mechanization Support Scheme',
      status: 'Active',
      amount: '₹2,50,000',
      statusFlow: [
        { step: 'Application Submitted', status: 'completed', date: '15 Oct 2023' },
        { step: 'Document Verification', status: 'completed', date: '18 Oct 2023' },
        { step: 'Field Inspection', status: 'completed', date: '22 Oct 2023' },
        { step: 'Loan Approved', status: 'completed', date: '25 Oct 2023' },
        { step: 'Amount Disbursed', status: 'active', date: '28 Oct 2023' }
      ]
    },
    {
      id: 2,
      referenceId: '#PNB-CROP-2023-7721',
      schemeName: 'Crop Insurance Scheme',
      status: 'Processing',
      amount: '₹1,80,000',
      statusFlow: [
        { step: 'Application Submitted', status: 'completed', date: '12 Nov 2023' },
        { step: 'Document Verification', status: 'completed', date: '15 Nov 2023' },
        { step: 'Field Inspection', status: 'active', date: 'In Progress' },
        { step: 'Loan Approval', status: 'pending', date: 'Pending' },
        { step: 'Amount Disbursement', status: 'pending', date: 'Pending' }
      ]
    },
    {
      id: 3,
      referenceId: '#HDFC-KCC-2023-9934',
      schemeName: 'Kisan Credit Card',
      status: 'Approved',
      amount: '₹5,00,000',
      statusFlow: [
        { step: 'Application Submitted', status: 'completed', date: '5 Dec 2023' },
        { step: 'Document Verification', status: 'completed', date: '7 Dec 2023' },
        { step: 'Credit Check', status: 'completed', date: '8 Dec 2023' },
        { step: 'Loan Approved', status: 'completed', date: '10 Dec 2023' },
        { step: 'Card Processing', status: 'active', date: 'In Progress' }
      ]
    }
  ];

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

  const handleLoanCardPress = (loan: any) => {
    setSelectedLoan(loan);
    setShowLoanStatus(true);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            router.replace('/login');
          }
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F5" />
      
      {/* Creative Header with User Profile */}
      <LinearGradient
        colors={['#FF8C42', '#FFB366', '#FFEDE0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.creativeHeader}
      >
        <View style={styles.headerContent}>
          <View style={styles.profileCard}>
            <View style={styles.profileIconContainer}>
              <Text style={styles.profileIcon}>👤</Text>
            </View>
            <View style={styles.userDetailsContainer}>
              <Text style={styles.userNameCreative}>{user.name}</Text>
              <Text style={styles.userPhoneCreative}>{user.mobile}</Text>
              <View style={styles.userIdBadge}>
                <Text style={styles.userIdText}>ID: {user.userId}</Text>
              </View>
            </View>
          </View>
          <View style={styles.headerDecoration}>
            <View style={styles.decorativeCircle1} />
            <View style={styles.decorativeCircle2} />
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Loan Information Cards - Horizontal Scroll */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>My Loans</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.loanCardsContainer}
            contentContainerStyle={styles.loanCardsContent}
          >
            {mockLoans.map((loan) => (
              <TouchableOpacity 
                key={loan.id} 
                style={styles.loanCard}
                onPress={() => handleLoanCardPress(loan)}
                activeOpacity={0.7}
              >
                <View style={styles.loanCardHeader}>
                  <Text style={styles.loanStatus}>{loan.status}</Text>
                  <Text style={styles.loanAmount}>{loan.amount}</Text>
                </View>
                <View style={styles.loanCardContent}>
                  <Text style={styles.loanLabel}>Reference ID</Text>
                  <Text style={styles.loanValue}>{loan.referenceId}</Text>
                  <Text style={styles.loanLabel}>Scheme</Text>
                  <Text style={styles.loanSchemeName}>{loan.schemeName}</Text>
                </View>
                <View style={styles.tapIndicator}>
                  <Text style={styles.tapText}>Tap for details</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Data Sync Status Card */}
        <View style={styles.syncCard}>
          <View style={styles.syncCardContent}>
            <View style={styles.syncIcon}>
              <Text style={styles.syncIconText}>☁️</Text>
            </View>
            <View style={styles.syncTextContainer}>
              <Text style={styles.syncTitle}>Data Sync Status</Text>
              <Text style={styles.syncSubtitle}>2 pending uploads. Connect to sync.</Text>
            </View>
          </View>
        </View>

        {/* Menu Options */}
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuOption}
            onPress={() => setShowLanguageModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconContainer}>
              <Text style={styles.menuOptionIcon}>🌐</Text>
            </View>
            <Text style={styles.menuOptionText}>Select Language</Text>
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
            <Text style={styles.menuOptionText}>Enable Notifications</Text>
            <View style={[styles.toggleSwitch, notificationsEnabled && styles.toggleSwitchActive]}>
              <View style={[styles.toggleThumb, notificationsEnabled && styles.toggleThumbActive]} />
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Logout Section */}
        <View style={styles.logoutSection}>
          <TouchableOpacity onPress={handleLogout} activeOpacity={0.7}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.bottomSpacer} />
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
            <Text style={styles.modalTitle}>Select Language</Text>
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
              <Text style={styles.cancelButtonText}>Cancel</Text>
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
              <Text style={styles.confirmButtonText}>Confirm</Text>
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
                  {selectedLoan?.schemeName || 'Loan Status'}
                </Text>
                <Text style={styles.compactRefId}>{selectedLoan?.referenceId}</Text>
                <Text style={styles.compactAmount}>{selectedLoan?.amount}</Text>
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
            <Text style={styles.compactFlowTitle}>Progress Timeline</Text>
            {selectedLoan?.statusFlow.map((step: any, index: number) => (
              <View key={index} style={styles.compactStatusStep}>
                <View style={styles.compactStepIndicator}>
                  <View style={[
                    styles.compactStepIcon,
                    step.status === 'completed' && styles.compactStepCompleted,
                    step.status === 'active' && styles.compactStepActive,
                    step.status === 'pending' && styles.compactStepPending
                  ]}>
                    {step.status === 'completed' ? (
                      <Text style={styles.compactStepIconText}>✓</Text>
                    ) : step.status === 'active' ? (
                      <Text style={styles.compactStepIconText}>●</Text>
                    ) : (
                      <Text style={styles.compactStepIconText}>○</Text>
                    )}
                  </View>
                  {index < selectedLoan.statusFlow.length - 1 && (
                    <View style={styles.compactStepConnector} />
                  )}
                </View>
                <View style={styles.compactStepContent}>
                  <Text style={styles.compactStepTitle}>{step.step}</Text>
                  <Text style={styles.compactStepDate}>{step.date}</Text>
                </View>
              </View>
            ))}
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
  // Creative Header Styles
  creativeHeader: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 50,
    paddingBottom: Math.max(30, height * 0.04),
    paddingHorizontal: Math.max(20, width * 0.06),
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
    backgroundColor: '#FFE4D6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Math.max(16, scale * 20),
  },
  profileIcon: {
    fontSize: Math.max(28, scale * 32),
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
    backgroundColor: '#FFE4D6',
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#FFE4D6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Math.max(10, scale * 12),
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
    height: Math.max(40, height * 0.05),
  },
  
  // Section Styles
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
  
  // Compact Sync Card
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
  
  // Menu Section
  menuSection: {
    marginBottom: Math.max(16, height * 0.02),
  },
  
  // Logout Section
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

});