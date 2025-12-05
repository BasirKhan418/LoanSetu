import React, { createContext, useContext, useState } from 'react';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

interface LanguageContextType {
  currentLanguage: Language;
  availableLanguages: Language[];
  setLanguage: (language: Language) => void;
  isLanguageSelected: boolean;
  setUserLanguage: (userId: string, languageCode: string) => void;
  initializeUserLanguage: (userId: string, userLanguageCode?: string) => void;
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

  // Initialize language for a logged-in user
  const initializeUserLanguage = (userId: string, userLanguageCode?: string) => {
    if (userLanguageCode) {
      const language = languages.find(lang => lang.code === userLanguageCode);
      if (language) {
        setCurrentLanguage(language);
        setIsLanguageSelected(true);
      } else {
        // Invalid language code, reset to default
        setCurrentLanguage(languages[0]);
        setIsLanguageSelected(false);
      }
    } else {
      // No language selected for this user
      setCurrentLanguage(languages[0]);
      setIsLanguageSelected(false);
    }
  };

  // Set language for current session (will be saved to backend)
  const setLanguage = (language: Language) => {
    setCurrentLanguage(language);
    setIsLanguageSelected(true);
  };

  // This function will be called when language needs to be saved to backend
  const setUserLanguage = (userId: string, languageCode: string) => {
    // This will be implemented when backend is ready
    // For now, just update local state
    const language = languages.find(lang => lang.code === languageCode);
    if (language) {
      setCurrentLanguage(language);
      setIsLanguageSelected(true);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        availableLanguages: languages,
        setLanguage,
        isLanguageSelected,
        setUserLanguage,
        initializeUserLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}