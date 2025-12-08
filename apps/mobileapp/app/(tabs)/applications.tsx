import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/utils/translations';
import { router } from 'expo-router';
import { ChevronRight, FileText, Search, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Dimensions,
  Platform,
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

interface Loan {
  id: number;
  referenceId: string;
  schemeName: string;
  amount: string;
  appliedDate: string;
  verificationStatus: 'pending' | 'submitted' | 'verified';
}

export default function ApplicationsScreen() {
  const insets = useSafeAreaInsets();
  const { currentLanguage } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  
  const tabBarHeight = Platform.OS === 'ios' 
    ? Math.max(80, 50 + insets.bottom) 
    : Math.max(70, 60 + insets.bottom);

  const approvedLoans: Loan[] = [
    {
      id: 1,
      referenceId: '#SBI-AGRI-2023-8845',
      schemeName: 'Farm Mechanization Support Scheme',
      amount: '₹2,50,000',
      appliedDate: '15 Oct 2023',
      verificationStatus: 'pending'
    },
    {
      id: 2,
      referenceId: '#PNB-CROP-2023-7721',
      schemeName: 'Crop Insurance Scheme',
      amount: '₹1,80,000',
      appliedDate: '12 Nov 2023',
      verificationStatus: 'submitted'
    },
    {
      id: 3,
      referenceId: '#HDFC-KCC-2023-9934',
      schemeName: 'Kisan Credit Card',
      amount: '₹5,00,000',
      appliedDate: '5 Dec 2023',
      verificationStatus: 'verified'
    },
    {
      id: 4,
      referenceId: '#AXIS-AGR-2023-6612',
      schemeName: 'Agricultural Equipment Loan',
      amount: '₹3,20,000',
      appliedDate: '20 Dec 2023',
      verificationStatus: 'pending'
    }
  ];

  const filteredLoans = approvedLoans.filter(loan =>
    loan.schemeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLoanPress = (loan: Loan) => {
    router.push({
      pathname: '/loan-verification',
      params: {
        loanId: loan.id.toString(),
        schemeName: loan.schemeName,
        amount: loan.amount,
        referenceId: loan.referenceId,
      }
    });
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
      >
        <View style={styles.loansContainer}>
          {filteredLoans.map((loan) => (
            <TouchableOpacity
              key={loan.id}
              style={styles.loanCard}
              activeOpacity={0.7}
              onPress={() => handleLoanPress(loan)}
            >
              <View style={styles.loanCardContent}>
                <View style={styles.loanIcon}>
                  <FileText size={24} color="#FC8019" strokeWidth={2} />
                </View>
                <View style={styles.loanInfo}>
                  <Text style={styles.loanName}>{loan.schemeName}</Text>
                  <Text style={styles.loanAmount}>{loan.amount}</Text>
                  <Text style={styles.loanDate}>{loan.referenceId} • {loan.appliedDate}</Text>
                </View>
              </View>
              <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
            </TouchableOpacity>
          ))}

          {filteredLoans.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>{getTranslation('noLoansFound', currentLanguage.code)}</Text>
              <Text style={styles.emptyStateSubtext}>{getTranslation('tryAdjustingSearch', currentLanguage.code)}</Text>
            </View>
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
  loanName: {
    fontSize: Math.max(15, scale * 16),
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 20,
    marginBottom: 4,
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
});
