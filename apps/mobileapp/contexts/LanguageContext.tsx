import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

interface LanguageContextType {
  currentLanguage: Language;
  availableLanguages: Language[];
  setLanguage: (language: Language) => Promise<void>;
  isLanguageSelected: boolean;
  loadLanguage: () => Promise<void>;
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'od', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
];

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(languages[0]); // Default to English
  const [isLanguageSelected, setIsLanguageSelected] = useState(false);

  useEffect(() => {
    loadLanguage();
  }, []);

  // Load language from AsyncStorage
  const loadLanguage = async () => {
    try {
      const storedLanguageCode = await AsyncStorage.getItem('languageCode');
      
      if (storedLanguageCode) {
        const language = languages.find(lang => lang.code === storedLanguageCode);
        if (language) {
          setCurrentLanguage(language);
          setIsLanguageSelected(true);
        }
      }
    } catch (error) {
      console.error('Failed to load language:', error);
    }
  };

  // Set language and save to AsyncStorage
  const setLanguage = async (language: Language) => {
    try {
      await AsyncStorage.setItem('languageCode', language.code);
      setCurrentLanguage(language);
      setIsLanguageSelected(true);
    } catch (error) {
      console.error('Failed to save language:', error);
      throw error;
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        availableLanguages: languages,
        setLanguage,
        isLanguageSelected,
        loadLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}