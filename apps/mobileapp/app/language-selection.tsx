import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    Platform,
    StatusBar as RNStatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/utils/translations';
import { Globe, Search } from 'lucide-react-native';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const { width, height } = Dimensions.get('window');
const scale = Math.min(width / 375, height / 812);

export default function LanguageSelectionScreen() {
  const { availableLanguages, setLanguage, currentLanguage } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const filteredLanguages = availableLanguages.filter(
    language =>
      language.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      language.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language);
  };

  const handleContinue = async () => {
    if (!selectedLanguage) {
      Alert.alert(
        getTranslation('selectLanguage', currentLanguage.code), 
        getTranslation('pleaseSelectLanguage', currentLanguage.code)
      );
      return;
    }

    setIsLoading(true);
    try {
      // Update language in context (for immediate UI update)
      setLanguage(selectedLanguage);
      
      // For testing - just simulate saving
      await new Promise(resolve => setTimeout(resolve, 500));
      
      router.replace('/(tabs)');
    } catch {
      Alert.alert(getTranslation('error', currentLanguage.code), getTranslation('failedSaveLanguage', currentLanguage.code));
    } finally {
      setIsLoading(false);
    }
  };

  const renderLanguageItem = ({ item }: { item: Language }) => (
    <TouchableOpacity
      style={[
        styles.languageItem,
        selectedLanguage?.code === item.code && styles.selectedLanguageItem,
      ]}
      onPress={() => handleLanguageSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.languageInfo}>
        <Text style={styles.flag}>{item.flag}</Text>
        <View style={styles.languageTextContainer}>
          <Text style={styles.languageName}>{item.name}</Text>
          <Text style={styles.languageNativeName}>{item.nativeName}</Text>
        </View>
      </View>
      {selectedLanguage?.code === item.code && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['#FFFFFF', '#FFF8F5', '#FFEDE0']}
      style={styles.container}
    >
      <StatusBar style="dark" backgroundColor="#FFF8F5" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>
              <Globe size={28} color="#FF8C42" strokeWidth={2} />
            </Text>
          </View>
        </View>
        <Text style={styles.title}>{getTranslation('selectLanguage', currentLanguage.code)}</Text>
        <Text style={styles.subtitle}>
          {getTranslation('choosePreferredLanguage', currentLanguage.code)}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>
            <Search size={16} color="#FF8C42" strokeWidth={2} />
          </Text>
          <TextInput
            style={styles.searchInput}
            placeholder={getTranslation('searchLanguages', currentLanguage.code)}
            placeholderTextColor="#999999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Language List */}
      <View style={styles.languageListContainer}>
        <Text style={styles.sectionTitle}>{getTranslation('allLanguages', currentLanguage.code)}</Text>
        <FlatList
          data={filteredLanguages}
          keyExtractor={(item) => item.code}
          renderItem={renderLanguageItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.languageList}
        />
      </View>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.continueButton, (!selectedLanguage || isLoading) && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!selectedLanguage || isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>
            {isLoading ? getTranslation('loading', currentLanguage.code) : getTranslation('continue', currentLanguage.code)}
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 20 : 50,
  },
  header: {
    alignItems: 'center',
    paddingTop: Math.max(16, height * 0.02),
    paddingBottom: Math.max(16, height * 0.02),
    paddingHorizontal: Math.max(24, width * 0.08),
  },
  logoContainer: {
    marginBottom: Math.max(12, height * 0.015),
    alignItems: 'center',
  },
  iconCircle: {
    width: Math.max(50, scale * 60),
    height: Math.max(50, scale * 60),
    borderRadius: Math.max(25, scale * 30),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#FF8C42',
  },
  iconText: {
    fontSize: Math.max(20, scale * 24),
  },
  title: {
    fontSize: Math.max(20, scale * 24),
    fontWeight: '700',
    color: '#2C2C2C',
    textAlign: 'center',
    marginBottom: Math.max(6, height * 0.008),
  },
  subtitle: {
    fontSize: Math.max(12, scale * 14),
    color: '#666666',
    textAlign: 'center',
    lineHeight: Math.max(20, scale * 24),
    fontWeight: '400',
  },
  searchContainer: {
    paddingHorizontal: Math.max(24, width * 0.08),
    marginBottom: Math.max(16, height * 0.02),
  },
  searchBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: Math.max(10, scale * 12),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Math.max(12, scale * 16),
    paddingVertical: Math.max(10, scale * 12),
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.2)',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    fontSize: Math.max(14, scale * 16),
    marginRight: Math.max(10, scale * 12),
  },
  searchInput: {
    flex: 1,
    fontSize: Math.max(13, scale * 14),
    color: '#2C2C2C',
    fontWeight: '500',
  },
  languageListContainer: {
    flex: 1,
    paddingHorizontal: Math.max(24, width * 0.08),
  },
  sectionTitle: {
    fontSize: Math.max(14, scale * 16),
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: Math.max(12, height * 0.015),
  },
  languageList: {
    paddingBottom: Math.max(104, height * 0.13),
  },
  languageItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: Math.max(10, scale * 12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Math.max(12, scale * 16),
    paddingVertical: Math.max(12, scale * 14),
    marginBottom: Math.max(8, scale * 10),
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.2)',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedLanguageItem: {
    borderColor: '#FF8C42',
    backgroundColor: '#FFF8F5',
    shadowOpacity: 0.15,
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Math.max(24, width * 0.08),
    paddingBottom: Math.max(20, height * 0.025),
    paddingTop: Math.max(8, height * 0.01),
    backgroundColor: 'rgba(255, 248, 245, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 140, 66, 0.1)',
  },
  continueButton: {
    backgroundColor: '#FF8C42',
    borderRadius: Math.max(12, scale * 16),
    paddingVertical: Math.max(14, scale * 18),
    alignItems: 'center',
    marginBottom: Math.max(12, height * 0.02),
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0.1,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: Math.max(16, scale * 18),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});