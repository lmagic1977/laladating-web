'use client';

import { useLanguage } from './LanguageContext';

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setLocale('en')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          locale === 'en' 
            ? 'bg-red-500 text-white' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLocale('zh')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          locale === 'zh' 
            ? 'bg-red-500 text-white' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        中文
      </button>
    </div>
  );
}
