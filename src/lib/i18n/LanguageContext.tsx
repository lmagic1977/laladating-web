'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Locale } from './translations';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    // Load saved preference
    const saved = localStorage.getItem('locale') as Locale;
    if (saved && (saved === 'en' || saved === 'zh')) {
      setLocaleState(saved);
    } else {
      // Auto-detect browser language
      const browserLang = navigator.language.split('-')[0];
      if (browserLang === 'zh') {
        setLocaleState('zh');
      }
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  // Dynamic import of translations to avoid SSR issues
  const [translations, setTranslations] = React.useState<Record<string, string>>({});

  useEffect(() => {
    import('./translations').then((mod) => {
      setTranslations(mod.translations[locale] || mod.translations['en']);
    });
  }, [locale]);

  const t = (key: string): string => {
    return translations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
