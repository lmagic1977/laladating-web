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
    <div className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/5 p-1">
      <button
        onClick={() => setLocale('zh')}
        className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
          locale === 'zh' ? 'bg-pink-500 text-white' : 'text-white/80 hover:bg-white/10'
        }`}
        aria-label="Switch to Chinese"
      >
        中文
      </button>
      <button
        onClick={() => setLocale('en')}
        className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
          locale === 'en' ? 'bg-pink-500 text-white' : 'text-white/80 hover:bg-white/10'
        }`}
        aria-label="Switch to English"
      >
        ENGLISH
      </button>
    </div>
  );
}
