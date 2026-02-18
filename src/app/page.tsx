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
    <div className="space-y-14">
      <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="inline-flex rounded-full border border-pink-300/35 bg-pink-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-pink-200">
            Huntington Beach
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl text-pink-300 drop-shadow-[0_0_14px_rgba(255,120,181,0.55)]">
            {t('home.hero_title')}
          </h1>
          <p className="mt-5 max-w-xl text-base text-white/75">{t('home.hero_subtitle')}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/events" className="rounded-full px-5 py-2.5 text-sm font-semibold neon-button">
              {t('home.view_events')}
            </a>
            <a
              href="/account"
              className="rounded-full border border-white/25 px-5 py-2.5 text-sm font-semibold text-white/85 hover:bg-white/10"
            >
              Join From Account / 去我的账户报名
            </a>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { label: t('home.age_range'), value: nextEvent?.age_range || '--' },
              { label: t('home.rounds'), value: '8' },
              { label: t('home.duration'), value: '90' },
            ].map((item) => (
              <div key={item.label} className="neon-card p-3 text-center">
                <div className="text-lg font-semibold text-yellow-300">{item.value}</div>
                <div className="text-xs text-white/60">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <img
            src="/artwork/speed-date-hero.svg"
            alt="LALA speed dating hero"
            className="w-full rounded-3xl border border-white/10 shadow-[0_20px_60px_rgba(10,12,26,0.65)]"
          />
          <div className="absolute -bottom-5 -left-5 hidden w-40 rounded-2xl border border-white/20 bg-black/40 p-2 backdrop-blur md:block">
            <img src="/artwork/speed-date-chat.svg" alt="Chat moments" className="rounded-xl" />
          </div>
          <div className="absolute -top-5 -right-5 hidden w-40 rounded-2xl border border-white/20 bg-black/40 p-2 backdrop-blur md:block">
            <img src="/artwork/speed-date-party.svg" alt="Party moments" className="rounded-xl" />
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-pink-300 drop-shadow-[0_0_10px_rgba(255,120,181,0.45)]">{t('home.upcoming')}</h2>
          <a href="/events" className="text-sm text-white/60 hover:text-white">
            {t('events.all')}
          </a>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {activeEvents.slice(0, 3).map((event) => (
            <div key={event.id} className="neon-card p-5">
              <div className="text-xs uppercase tracking-wide text-cyan-300">{t('events.open')}</div>
              <h3 className="mt-3 text-lg font-semibold text-white">{event.name}</h3>
              <p className="mt-1 text-sm text-white/60">{event.location}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-white/60">
                <span>
                  {event.date} · {event.time}
                </span>
                <span className="text-pink-300">{event.price}</span>
              </div>
            </div>
          ))}
          {!activeEvents.length && <div className="text-white/60">{t('common.loading')}</div>}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="neon-card p-3">
          <img src="/artwork/speed-date-chat.svg" alt="Quick chat round" className="w-full rounded-xl" />
          <p className="mt-3 text-sm text-white/70">Quick 5-minute talks / 快速5分钟交流</p>
        </div>
        <div className="neon-card p-3">
          <img src="/artwork/speed-date-party.svg" alt="Match and vote" className="w-full rounded-xl" />
          <p className="mt-3 text-sm text-white/70">Match & vote in each round / 每轮心动投票</p>
        </div>
        <div className="neon-card p-3">
          <img src="/artwork/speed-date-hero.svg" alt="Speed dating stage" className="w-full rounded-xl" />
          <p className="mt-3 text-sm text-white/70">Hosted events every week / 每周组织不同主题</p>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="neon-card p-6">
          <h3 className="text-lg font-semibold text-pink-300">{t('how.title')}</h3>
          <ul className="mt-4 space-y-3 text-sm text-white/70">
            <li>
              {t('how.step1_title')}: {t('how.step1_desc')}
            </li>
            <li>
              {t('how.step2_title')}: {t('how.step2_desc')}
            </li>
            <li>
              {t('how.step3_title')}: {t('how.step3_desc')}
            </li>
            <li>
              {t('how.step4_title')}: {t('how.step4_desc')}
            </li>
          </ul>
        </div>

        <div className="neon-card p-6">
          <h3 className="text-lg font-semibold text-pink-300">{t('features.title')}</h3>
          <ul className="mt-4 space-y-3 text-sm text-white/70">
            <li>💕 {t('features.crush')}: {t('features.crush_desc')}</li>
            <li>🗳️ {t('features.vote')}: {t('features.vote_desc')}</li>
            <li>🎁 {t('features.raffle')}: {t('features.raffle_desc')}</li>
          </ul>
          <a href="/onsite" className="mt-5 inline-block rounded-full px-4 py-2 text-sm font-semibold neon-button">
            {t('home.enter_onsite')}
          </a>
        </div>
      </section>
    </div>
  );
}
