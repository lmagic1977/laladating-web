'use client';

import { LangToggle, useLanguage } from '@/lib/LanguageContext';

export function SiteShell({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/60 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-gradient-to-r from-pink-500 to-cyan-400 flex items-center justify-center text-2xl font-bold text-white">
              💕
            </div>
          </a>
          <nav className="hidden md:flex flex-1 max-w-2xl mx-8 items-center justify-between text-base font-semibold text-white/80">
            <a href="/" className="flex-1 text-center hover:text-white">{t('nav.home')}</a>
            <a href="/events" className="flex-1 text-center hover:text-white">{t('nav.events')}</a>
            <a href="/register" className="flex-1 text-center hover:text-white">{t('nav.register')}</a>
            <a href="/onsite" className="flex-1 text-center hover:text-white">{t('nav.onsite')}</a>
          </nav>
          <div className="flex items-center gap-2">
            <LangToggle />
            <a href="/register" className="rounded-full px-4 py-2 text-sm font-semibold neon-button">
              {t('nav.cta')}
            </a>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
      <footer className="mx-auto w-full max-w-6xl px-6 pb-10 text-sm text-white/60">
        LALA Speed Dating · Huntington Beach, CA
      </footer>
    </div>
  );
}
