'use client';
import { useLanguage } from '@/lib/LanguageContext';

export default function HomePage() {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-12">
      <section className="grid gap-10 lg:grid-cols-2">
        <div>
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
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
          <h3 className="mt-4 text-xl font-semibold">Speed Dating · 20-30</h3>
          <p className="mt-1 text-sm text-white/60">Dance Studio · 20:00</p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { label: t('home.age_range'), value: "20-30" },
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
          <h2 className="text-2xl font-semibold">{t('home.upcoming')}</h2>
          <a href="/events" className="text-sm text-white/60 hover:text-white">
            {t('events.all')}
          </a>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { title: t('event.beach_20_30'), time: '20:00', price: '$39' },
            { title: t('event.weekend_25_35'), time: '20:00', price: '$39' },
            { title: t('event.spring_24_32'), time: '20:00', price: '$39' },
          ].map((event) => (
            <div key={`${event.title}-${event.time}`} className="neon-card p-5">
              <div className="text-xs uppercase text-cyan-300">{t('events.open')}</div>
              <h3 className="mt-3 text-lg font-semibold">{event.title}</h3>
              <p className="mt-1 text-sm text-white/60">{t('events.location')}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-white/60">
                <span>{event.time}</span>
                <span className="text-pink-300">{event.price}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="neon-card p-6">
          <h3 className="text-lg font-semibold">{t('how.title')}</h3>
          <ul className="mt-4 space-y-3 text-sm text-white/70">
            <li>{t('how.step1_title')}: {t('how.step1_desc')}</li>
            <li>{t('how.step2_title')}: {t('how.step2_desc')}</li>
            <li>{t('how.step3_title')}: {t('how.step3_desc')}</li>
            <li>{t('how.step4_title')}: {t('how.step4_desc')}</li>
          </ul>
        </div>
        <div className="neon-card p-6">
          <h3 className="text-lg font-semibold">{t('features.title')}</h3>
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
