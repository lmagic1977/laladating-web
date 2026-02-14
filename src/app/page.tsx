'use client';
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';

interface EventItem {
  id: number | string;
  name: string;
  date: string;
  time: string;
  location: string;
  price: string;
  age_range: string;
  status: 'active' | 'closed';
}

export default function HomePage() {
  const { t } = useLanguage();
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    const loadEvents = async () => {
      const response = await fetch('/api/events', { cache: 'no-store' });
      const data = await response.json();
      setEvents(Array.isArray(data) ? data : []);
    };
    loadEvents();
  }, []);

  const now = new Date();
  const activeEvents = useMemo(
    () =>
      events
        .filter((event) => event.status === 'active')
        .filter((event) => {
          const dt = new Date(`${event.date}T${event.time || '00:00'}`);
          return Number.isNaN(dt.getTime()) || dt >= now;
        })
        .sort((a, b) => {
          const ta = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
          const tb = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
          return ta - tb;
        }),
    [events]
  );
  const nextEvent = activeEvents[0];
  
  return (
    <div className="space-y-12">
      <section className="grid gap-10 lg:grid-cols-2">
        <div>
          <h1 className="text-4xl font-bold leading-tight md:text-5xl text-pink-300 drop-shadow-[0_0_14px_rgba(255,120,181,0.55)]">
            {t('home.hero_title')}
          </h1>
          <p className="mt-4 text-base text-white/70">
            {t('home.hero_subtitle')}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/events" className="rounded-full px-4 py-2 text-sm font-semibold neon-button">
              {t('home.view_events')}
            </a>
            <a href="/register" className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white">
              {t('home.register_now')}
            </a>
          </div>
        </div>
        <div className="glass rounded-2xl p-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs uppercase text-white/80">
            {t('home.next_event')}
          </div>
          <h3 className="mt-4 text-xl font-semibold text-pink-200">
            {nextEvent ? nextEvent.name : 'LALA Speed Dating'}
          </h3>
          <p className="mt-1 text-sm text-white/60">
            {nextEvent ? `${nextEvent.location} · ${nextEvent.time}` : t('common.loading')}
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { label: t('home.age_range'), value: nextEvent?.age_range || '--' },
              { label: t('home.rounds'), value: "8" },
              { label: t('home.duration'), value: "90" },
            ].map((item) => (
              <div key={item.label} className="neon-card p-3 text-center">
                <div className="text-lg font-semibold text-yellow-300">{item.value}</div>
                <div className="text-xs text-white/60">{item.label}</div>
              </div>
            ))}
          </div>
          <a href="/onsite" className="mt-6 inline-block rounded-full px-4 py-2 text-sm neon-button">
            {t('home.enter_onsite')}
          </a>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-pink-300 drop-shadow-[0_0_10px_rgba(255,120,181,0.45)]">{t('home.upcoming')}</h2>
          <a href="/events" className="text-sm text-white/60 hover:text-white">
            {t('events.all')}
          </a>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {activeEvents.slice(0, 3).map((event) => (
            <div key={event.id} className="neon-card p-5">
              <div className="text-xs uppercase text-cyan-300">{t('events.open')}</div>
              <h3 className="mt-3 text-lg font-semibold text-white">{event.name}</h3>
              <p className="mt-1 text-sm text-white/60">{event.location}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-white/60">
                <span>{event.time}</span>
                <span className="text-pink-300">{event.price}</span>
              </div>
            </div>
          ))}
          {!activeEvents.length && <div className="text-white/60">{t('common.loading')}</div>}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="neon-card p-6">
          <h3 className="text-lg font-semibold text-pink-300">{t('how.title')}</h3>
          <ul className="mt-4 space-y-3 text-sm text-white/70">
            <li>{t('how.step1_title')}: {t('how.step1_desc')}</li>
            <li>{t('how.step2_title')}: {t('how.step2_desc')}</li>
            <li>{t('how.step3_title')}: {t('how.step3_desc')}</li>
            <li>{t('how.step4_title')}: {t('how.step4_desc')}</li>
          </ul>
        </div>
        <div className="neon-card p-6">
          <h3 className="text-lg font-semibold text-pink-300">{t('features.title')}</h3>
          <ul className="mt-4 space-y-3 text-sm text-white/70">
            <li>💕 {t('features.crush')}: {t('features.crush_desc')}</li>
            <li>🗳️ {t('features.vote')}: {t('features.vote_desc')}</li>
            <li>🎁 {t('features.raffle')}: {t('features.raffle_desc')}</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
