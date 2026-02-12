'use client';
import { useLanguage } from '@/lib/LanguageContext';

export default function OnsitePage() {
  const { t } = useLanguage();
  
  return (
    <div className="max-w-md mx-auto text-center">
      <h1 className="text-3xl font-semibold">🏖️ {t('home.enter_onsite')}</h1>
      <p className="mt-4 text-white/60">{t('how.step1_desc')}</p>
      <div className="mt-8 neon-card p-8">
        <div className="w-48 h-48 mx-auto bg-white/10 rounded-xl flex items-center justify-center text-white/40">
          [QR Code]
        </div>
        <p className="mt-4 text-sm text-white/60">{t('how.step1_title')}</p>
      </div>
      <div className="mt-8 grid grid-cols-4 gap-3">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i + 1} className="neon-card p-4 text-center">
            <div className="text-2xl font-bold text-pink-300">{i + 1}</div>
            <div className="text-xs text-white/40">{t('common.round')}</div>
          </div>
        ))}
      </div>
      <button className="mt-8 rounded-full px-6 py-2 neon-button font-semibold">
        💕 {t('features.crush')}
      </button>
    </div>
  );
}
