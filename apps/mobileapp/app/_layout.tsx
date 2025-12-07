// apps/mobileapp/app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/contexts/AuthContext';
import { DatabaseProvider } from '@/contexts/DatabaseContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import '../global.css';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <DatabaseProvider>
        <AuthProvider>
          <LanguageProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="splash" />
                <Stack.Screen name="login" />
                <Stack.Screen name="language-selection" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="loan-verification" />
                <Stack.Screen name="submission-status" />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              </Stack>
              <StatusBar style="auto" />
            </ThemeProvider>
          </LanguageProvider>
        </AuthProvider>
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}