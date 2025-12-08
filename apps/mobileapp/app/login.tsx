import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StatusBar as RNStatusBar,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');
const scale = Math.min(width / 375, height / 812);

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const router = useRouter();
  const { sendOTP, verifyOTP, isLoading, user } = useAuth();
  
  const scrollViewRef = useRef<ScrollView>(null);
  const mobileInputRef = useRef<TextInput>(null);
  const otpInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!isLoading && user) {
      console.log('[Login] User already authenticated, redirecting to home');
      router.replace('/(tabs)');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  const handleSendOTP = async () => {
    if (!phone || phone.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }
    
    try {
      const response = await sendOTP(phone);
      
      if (response.success) {
        Alert.alert('Success', response.message);
        setStep('otp');
        
        setTimeout(() => {
          otpInputRef.current?.focus();
        }, 100);
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
      console.error('Send OTP Error:', error);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }
    
    try {
      const response = await verifyOTP(phone, otp);
      
      if (response.success && response.user) {
        // Check if user has selected language before
        const storedLanguage = await AsyncStorage.getItem('languageCode');
        
        if (storedLanguage) {
          // User has already selected language, go directly to home
          router.replace('/(tabs)');
        } else {
          // No language selected, go to language selection
          router.replace('/language-selection');
        }
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Verification failed. Please try again.');
      console.error('Verify OTP Error:', error);
    }
  };

  const formatMobileNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    return cleaned;
  };

  return (
    <LinearGradient
      colors={['#FFFFFF', '#FFF8F5', '#FFEDE0']}
      style={styles.container}
    >
      <StatusBar style="dark" backgroundColor="#FFF8F5" />
      <KeyboardAvoidingView 
        style={styles.keyboardContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        enabled={true}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          bounces={false}
          scrollEnabled={true}
          nestedScrollEnabled={false}
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require('@/assets/icon.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>LoanSetu</Text>
            <Text style={styles.subtitle}>
              {step === 'mobile' ? 'Secure Login with Mobile Number' : 'Enter Verification Code'}
            </Text>
            <View style={styles.headerUnderline} />
          </View>

        <View style={styles.form}>
          {step === 'mobile' ? (
            <>
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Mobile Number</Text>
                <View style={styles.mobileInputContainer}>
                  <View style={styles.countryCodeContainer}>
                    <Text style={styles.countryCode}>+91</Text>
                  </View>
                  <TextInput
                    ref={mobileInputRef}
                    style={styles.mobileInput}
                    value={phone}
                    onChangeText={(text) => setPhone(formatMobileNumber(text))}
                    placeholder="Enter 10-digit mobile number"
                    placeholderTextColor="#999"
                    keyboardType="phone-pad"
                    maxLength={10}
                    onFocus={() => {
                      setTimeout(() => {
                        scrollViewRef.current?.scrollToEnd({ animated: true });
                      }, 300);
                    }}
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.primaryButton, isLoading && styles.buttonDisabled]} 
                onPress={handleSendOTP}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>
                  {isLoading ? 'Sending OTP...' : 'Get OTP'}
                </Text>
              </TouchableOpacity>

              <View style={styles.termsSection}>
            <Text style={styles.termsText}>
              By signing in you agree to follow our{' '}
              <Text style={styles.linkText}>Terms and Conditions</Text>
              {' '}and{' '}
              <Text style={styles.linkText}>Privacy Policy</Text>
            </Text>
          </View>
            </>
          ) : (
            <>
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Verification Code</Text>
                <TextInput
                  ref={otpInputRef}
                  style={styles.otpInput}
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="• • • • • •"
                  placeholderTextColor="#CCC"
                  keyboardType="number-pad"
                  maxLength={6}
                  textAlign="center"
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 300);
                  }}
                />
              </View>

              <View style={styles.otpInfo}>
                <Text style={styles.otpInfoText}>
                  Code sent to +91 {phone}
                </Text>
                <TouchableOpacity 
                  onPress={() => setStep('mobile')} 
                  style={styles.changeNumberButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.changeNumberText}>Change Number</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[styles.primaryButton, isLoading && styles.buttonDisabled]} 
                onPress={handleVerifyOTP}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>
                  {isLoading ? 'Verifying...' : 'Verify & Login'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.resendButton}
                onPress={handleSendOTP}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <Text style={styles.changeNumberText}>Resend Code</Text>
              </TouchableOpacity>
            </>
          )}

          
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Math.max(24, width * 0.08),
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) + 40 : 60,
    paddingBottom: Math.max(80, height * 0.1),
  },
  
  // Header Section
  header: {
    alignItems: 'center',
    paddingBottom: Math.max(20, height * 0.03),
    marginBottom: Math.max(20, height * 0.02),
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
  form: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: Math.max(10, height * 0.015),
  },
  inputSection: {
    marginBottom: Math.max(24, height * 0.04),
  },
  inputLabel: {
    fontSize: Math.max(14, scale * 16),
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: Math.max(10, height * 0.015),
    letterSpacing: 0.3,
  },
  mobileInputContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: Math.max(12, scale * 16),
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 140, 66, 0.2)',
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  countryCodeContainer: {
    backgroundColor: 'rgba(255, 140, 66, 0.08)',
    paddingHorizontal: Math.max(12, scale * 16),
    paddingVertical: Math.max(14, scale * 18),
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 140, 66, 0.2)',
  },
  countryCode: {
    fontSize: Math.max(14, scale * 16),
    fontWeight: '700',
    color: '#FF6B14',
  },
  mobileInput: {
    flex: 1,
    paddingHorizontal: Math.max(12, scale * 16),
    paddingVertical: Math.max(14, scale * 18),
    fontSize: Math.max(14, scale * 16),
    color: '#2C2C2C',
    fontWeight: '500',
  },
  otpInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: Math.max(12, scale * 16),
    paddingVertical: Math.max(14, scale * 12),
    paddingHorizontal: Math.max(12, scale * 16),
    fontSize: Math.max(20, scale * 28),
    fontWeight: '700',
    borderWidth: 2,
    borderColor: 'rgba(255, 140, 66, 0.2)',
    color: '#2C2C2C',
    letterSpacing: Math.max(4, scale * 8),
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  otpInfo: {
    alignItems: 'center',
    marginBottom: Math.max(6, height * 0.005),
    marginTop: -(Math.max(6, height * 0.0175))
  },
  otpInfoText: {
    fontSize: Math.max(12, scale * 14),
    color: '#666666',
    fontWeight: '500',
    textAlign: 'center',
  },
  changeNumberButton: {
    paddingHorizontal: Math.max(12, scale * 16),
    paddingVertical: Math.max(6, scale * 8),
  },
  changeNumberText: {
    fontSize: Math.max(12, scale * 14),
    color: '#FF6B14',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  resendButton: {
    paddingHorizontal: Math.max(12, scale * 16),
    paddingBottom: Math.max(6, scale * 8),
    alignItems: 'center',
  },
  primaryButton: {
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
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: Math.max(16, scale * 18),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  termsSection: {
    marginBottom: Math.max(16, height * 0.02),
    paddingHorizontal: Math.max(8, width * 0.02),
  },
  termsText: {
    fontSize: Math.max(12, scale * 14),
    color: '#666666',
    textAlign: 'center',
    lineHeight: Math.max(18, scale * 20),
    fontWeight: '400',
  },
  linkText: {
    color: '#FF6B14',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});