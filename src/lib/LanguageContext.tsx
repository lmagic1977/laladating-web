'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { translations, Locale } from './i18n/translations';

type LanguageContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  isLocaleReady: boolean;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [isLocaleReady, setIsLocaleReady] = useState(false);

  useEffect(() => {
    // Check localStorage first, then navigator language
    const savedLang = localStorage.getItem('locale') as Locale | null;
    if (savedLang && (savedLang === 'en' || savedLang === 'zh')) {
      setLocaleState(savedLang);
    } else {
      const browserLang = navigator.language.split('-')[0];
      setLocaleState(browserLang === 'zh' ? 'zh' : 'en');
    }
    setIsLocaleReady(true);
    
    // Listen for language changes from the toggle
    const handleLangChange = (e: CustomEvent) => {
      setLocaleState(e.detail as Locale);
    };
    window.addEventListener('langChange', handleLangChange as EventListener);
    return () => window.removeEventListener('langChange', handleLangChange as EventListener);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
    document.documentElement.lang = newLocale;
    window.dispatchEvent(new CustomEvent('langChange', { detail: newLocale }));
  };

  const t = (key: string): string => {
    const currentTranslations = translations[locale];
    return currentTranslations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, isLocaleReady }}>
      <body className="min-h-screen">
        {children}
      </body>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// LangToggle component for switching languages
export function LangToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <button
      onClick={() => setLocale(locale === 'en' ? 'zh' : 'en')}
      className="rounded-lg px-3 py-1 text-sm text-white/70 hover:bg-white/10 transition-colors"
      aria-label="Toggle language"
    >
      {locale === 'en' ? 'EN' : '中文'}
    </button>
  );
}
