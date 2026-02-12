'use client';
import { useLanguage } from './LanguageContext';

export function useTranslation() {
  const { t, locale, setLocale } = useLanguage();
  return { t, locale, setLocale };
}

// Simple hook for static pages
export function useT() {
  if (typeof window === 'undefined') return (key: string) => key;
  const { t } = useLanguage();
  return t;
}
