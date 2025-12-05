import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import {
  Dimensions,
  Image,
  Platform,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native';

import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/utils/translations';

const { width, height } = Dimensions.get('window');
const scale = Math.min(width / 375, height / 812);

export default function SplashScreenComponent() {
  const router = useRouter();
  const { currentLanguage } = useLanguage();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 2500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <LinearGradient
      colors={['#FFFFFF', '#FFF8F5', '#FFEDE0']}
      style={styles.container}
    >
      <StatusBar style="dark" backgroundColor="#FFF8F5" />
      
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>{getTranslation('appName', currentLanguage.code)}</Text>
        <Text style={styles.subtitle}>
          {getTranslation('appTagline', currentLanguage.code)}
        </Text>
        <View style={styles.headerUnderline} />
      </View>

      {/* Content Section with Bridge Image */}
      <View style={styles.content}>
        <Image
          source={require('@/assets/bridge.png')}
          style={styles.bridgeImage}
          resizeMode="cover"
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Trusted by Banks & Financial Institutions
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 40 : 60,
  },
  
  // Header Section
  header: {
    alignItems: 'center',
    paddingTop: Math.max(40, height * 0.08),
    paddingBottom: Math.max(20, height * 0.03),
    paddingHorizontal: Math.max(24, width * 0.08),
  },
  
  // Content Section
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  bridgeImage: {
    width: '100%',
    height: Math.max(200, height * 0.3),
    borderRadius: 0,
  },
  logoContainer: {
    marginBottom: Math.max(20, height * 0.03),
    alignItems: 'center',
  },
  logo: {
    width: Math.max(60, scale * 80),
    height: Math.max(60, scale * 80),
    maxWidth: 100,
    maxHeight: 100,
  },
  title: {
    fontSize: Math.max(24, scale * 32),
    fontWeight: '700',
    color: '#2C2C2C',
    marginBottom: Math.max(6, height * 0.01),
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Math.max(14, scale * 16),
    color: '#666666',
    textAlign: 'center',
    marginBottom: Math.max(12, height * 0.02),
    lineHeight: Math.max(20, scale * 22),
    paddingHorizontal: 20,
  },
  headerUnderline: {
    width: Math.max(50, scale * 60),
    height: 3,
    backgroundColor: '#FF8C42',
    borderRadius: 2,
  },
  
  // Footer
  footer: {
    alignItems: 'center',
    paddingBottom: Math.max(40, height * 0.06),
    paddingHorizontal: Math.max(24, width * 0.08),
  },
  footerText: {
    fontSize: Math.max(12, scale * 14),
    color: '#666666',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: Math.max(18, scale * 20),
  },
});