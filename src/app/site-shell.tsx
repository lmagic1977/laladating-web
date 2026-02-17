'use client';

import { useEffect, useState } from 'react';
import { LangToggle, useLanguage } from '@/lib/LanguageContext';

export function SiteShell({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const check = async () => {
      const res = await fetch('/api/user/session', { cache: 'no-store' });
      const data = await res.json();
      setLoggedIn(Boolean(data?.authenticated));
    };
    check();
  }, []);

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
            <a href={loggedIn ? "/account" : "/auth"} className="flex-1 text-center hover:text-white">
              {loggedIn ? t('nav.account') : t('nav.auth')}
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <LangToggle />
            <a href={loggedIn ? "/account" : "/auth"} className="rounded-full px-4 py-2 text-sm font-semibold neon-button">
              {loggedIn ? t('nav.account') : t('nav.auth')}
            </a>
          </div>
        </div>
        <nav className="md:hidden border-t border-white/10 px-4 py-3">
          <div className="grid grid-cols-5 text-center text-sm font-semibold text-white/80">
            <a href="/" className="hover:text-white">{t('nav.home')}</a>
            <a href="/events" className="hover:text-white">{t('nav.events')}</a>
            <a href="/register" className="hover:text-white">{t('nav.register')}</a>
            <a href="/onsite" className="hover:text-white">{t('nav.onsite')}</a>
            <a href={loggedIn ? "/account" : "/auth"} className="hover:text-white">
              {loggedIn ? t('nav.account') : t('nav.auth')}
            </a>
          </div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
      <footer className="mx-auto w-full max-w-6xl px-6 pb-10 text-sm text-white/60">
        LALA Speed Dating · Huntington Beach, CA
      </footer>
    </div>
  );
}
