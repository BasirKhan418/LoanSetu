import type { Loan } from '@/api/loansService';
import * as loansService from '@/api/loansService';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/utils/translations';
import { router } from 'expo-router';
import { ChevronRight, FileText, Search, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

export default function ApplicationsScreen() {
  const insets = useSafeAreaInsets();
  const { currentLanguage } = useLanguage();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const tabBarHeight = Platform.OS === 'ios' 
    ? Math.max(80, 50 + insets.bottom) 
    : Math.max(70, 60 + insets.bottom);

  // Fetch loans from API
  useEffect(() => {
    const fetchLoans = async () => {
      if (!user?.phone) {
        setIsLoading(false);
        return;
      }

      try {
        console.log('[Applications] Fetching loans for:', user.phone);
        const response = await loansService.getUserLoans(user.phone);
        
        if (response.success && response.data) {
          console.log('[Applications] Loans fetched:', response.data.length);
          setLoans(response.data);
        } else {
          console.error('[Applications] Failed to fetch loans:', response.message);
        }
      } catch (error) {
        console.error('[Applications] Error fetching loans:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLoans();
  }, [user?.phone]);

  const filteredLoans = loans.filter(loan =>
    loan.loanDetailsId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loan.loanDetailsId?.schemeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loan.loanNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLoanPress = (loan: Loan) => {
    const formattedAmount = `₹${(loan.sanctionAmount || 0).toLocaleString('en-IN')}`;
    router.push({
      pathname: '/loan-verification',
      params: {
        loanId: loan._id,
        schemeName: loan.loanDetailsId?.name || 'N/A',
        amount: formattedAmount,
        referenceId: loan.loanNumber,
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
              
              return (
                <TouchableOpacity
                  key={loan._id}
                  style={styles.loanCard}
                  activeOpacity={0.7}
                  onPress={() => handleLoanPress(loan)}
                >
                  <View style={styles.loanCardContent}>
                    <View style={styles.loanIcon}>
                      <FileText size={24} color="#FC8019" strokeWidth={2} />
                    </View>
                    <View style={styles.loanInfo}>
                      <Text style={styles.loanName}>{loan.loanDetailsId?.name || 'N/A'}</Text>
                      <Text style={styles.loanAmount}>{formattedAmount}</Text>
                      <Text style={styles.loanDate}>{loan.loanNumber} • {formattedDate}</Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
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
