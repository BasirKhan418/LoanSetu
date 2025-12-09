// apps/mobileapp/constants/designSystem.ts
import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');
const scale = width / 375;

export const DESIGN_SYSTEM = {
  // Colors
  colors: {
    // Primary
    primary: '#FC8019',
    primaryLight: '#FFE5D3',
    primaryDark: '#E06D0A',
    
    // Status Colors
    success: '#10B981',
    successLight: '#ECFDF5',
    error: '#EF4444',
    errorLight: '#FEF2F2',
    warning: '#F59E0B',
    warningLight: '#FFFBEB',
    info: '#3B82F6',
    infoLight: '#EFF6FF',
    
    // Neutral
    white: '#FFFFFF',
    black: '#000000',
    gray50: '#F9FAFB',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    gray800: '#1F2937',
    gray900: '#111827',
    
    // Backgrounds
    background: '#F9FAFB',
    surface: '#FFFFFF',
    surfaceAlt: '#F8F9FA',
    
    // Borders
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    borderDark: '#D1D5DB',
    
    // Text
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    textWhite: '#FFFFFF',
  },
  
  // Typography
  typography: {
    // Font Sizes
    fontSize: {
      xs: Math.max(11, scale * 12),
      sm: Math.max(13, scale * 14),
      base: Math.max(15, scale * 16),
      lg: Math.max(17, scale * 18),
      xl: Math.max(19, scale * 20),
      '2xl': Math.max(21, scale * 22),
      '3xl': Math.max(23, scale * 24),
      '4xl': Math.max(27, scale * 28),
    },
    
    // Font Weights
    fontWeight: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
      extrabold: '800' as const,
    },
    
    // Line Heights
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
  },
  
  // Border Radius
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    full: 9999,
  },
  
  // Shadows
  shadows: {
    none: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    base: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 6,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 8,
    },
  },
  
  // Component Styles
  components: {
    // Card
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#F3F4F6',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    
    // Button Primary
    buttonPrimary: {
      backgroundColor: '#FC8019',
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexDirection: 'row' as const,
      gap: 8,
    },
    
    // Button Secondary
    buttonSecondary: {
      backgroundColor: '#F3F4F6',
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexDirection: 'row' as const,
      gap: 8,
    },
    
    // Input
    input: {
      backgroundColor: '#F9FAFB',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: Math.max(15, scale * 16),
      color: '#1F2937',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    
    // Badge
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
    },
  },
  
  // Layout
  layout: {
    screenPadding: 16,
    sectionSpacing: 24,
    cardSpacing: 12,
  },
  
  // Animation
  animation: {
    duration: {
      fast: 200,
      normal: 300,
      slow: 500,
    },
  },
};

// Helper function to get safe area tab bar height
export const getTabBarHeight = (insetsBottom: number) => {
  return Platform.OS === 'ios' 
    ? Math.max(80, 50 + insetsBottom) 
    : Math.max(70, 60 + insetsBottom);
};

// Helper function for responsive scaling
export const scaleSize = (size: number) => Math.max(size, scale * size);
