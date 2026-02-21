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
            <img
              src="/logo-lala-speed.svg"
              alt="LALA Speed Dating"
              className="h-12 w-auto md:h-14"
            />
          </a>
          <nav className="hidden md:flex flex-1 max-w-2xl mx-8 items-center justify-between text-base font-semibold text-white/80">
            <a href="/" className="flex-1 text-center hover:text-white">{t('nav.home')}</a>
            <a href="/events" className="flex-1 text-center hover:text-white">{t('nav.events')}</a>
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
          <div className="grid grid-cols-4 text-center text-sm font-semibold text-white/80">
            <a href="/" className="hover:text-white">{t('nav.home')}</a>
            <a href="/events" className="hover:text-white">{t('nav.events')}</a>
            <a href="/onsite" className="hover:text-white">{t('nav.onsite')}</a>
            <a href={loggedIn ? "/account" : "/auth"} className="hover:text-white">
              {loggedIn ? t('nav.account') : t('nav.auth')}
            </a>
          </div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
      <footer className="mx-auto w-full max-w-6xl px-6 pb-10 text-sm text-white/70">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <p className="font-semibold text-white">LALA Speed Dating</p>
              <p className="mt-2 text-white/60">Huntington Beach, CA</p>
            </div>
            <div>
              <p className="font-semibold text-white">Site Links</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                <a href="/sitemap" className="hover:text-pink-300">Sitemap</a>
                <a href="/contact" className="hover:text-pink-300">Contact</a>
                <a href="/privacy" className="hover:text-pink-300">Privacy</a>
                <a href="/terms" className="hover:text-pink-300">Terms</a>
              </div>
            </div>
            <div>
              <p className="font-semibold text-white">Contact</p>
              <div className="mt-2 space-y-1 text-white/70">
                <p>Founder/CEO: Yangtuoge</p>
                <p>Phone: <a href="tel:+16269752527" className="hover:text-pink-300">626-975-2527</a></p>
                <p>WeChat: RUNMUNT</p>
                <p>WhatsApp: <a href="https://wa.me/18624383400" target="_blank" rel="noreferrer" className="hover:text-pink-300">+1 862 438 3400</a></p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
