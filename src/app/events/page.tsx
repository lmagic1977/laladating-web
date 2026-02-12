'use client';
import { useLanguage } from '@/lib/LanguageContext';

const events = [
  { id: 1, titleKey: 'event.beach_20_30', date: '2024-02-15', time: '20:00', price: '$39', status: 'open' },
  { id: 2, titleKey: 'event.weekend_25_35', date: '2024-02-22', time: '20:00', price: '$39', status: 'open' },
  { id: 3, titleKey: 'event.spring_24_32', date: '2024-03-01', time: '20:00', price: '$39', status: 'open' },
];

export default function EventsPage() {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">{t('home.upcoming')}</h1>
        <p className="mt-2 text-sm text-white/60">
          {t('events.subtitle')}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {events.map((event) => (
          <div key={event.id} className="neon-card p-5">
            <div className="text-xs uppercase text-cyan-300">{t(`events.${event.status}`)}</div>
            <h3 className="mt-3 text-lg font-semibold">{t(event.titleKey)}</h3>
            <p className="mt-1 text-sm text-white/60">{t('events.location')}</p>
            <div className="mt-4 flex items-center justify-between text-xs text-white/60">
              <span>{event.date} · {event.time}</span>
              <span className="text-pink-300">{event.price}</span>
            </div>
          </div>
        ))}
        {!events.length && <div className="text-white/60">{t('common.loading')}</div>}
      </div>
    </div>
  );
}
