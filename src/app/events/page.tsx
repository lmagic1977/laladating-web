'use client';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';

interface EventItem {
  id: number | string;
  name: string;
  date: string;
  time: string;
  location: string;
  price: string;
  status: 'active' | 'closed';
}

export default function EventsPage() {
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
            <div className="text-xs uppercase text-cyan-300">
              {event.status === 'active' ? t('events.open') : t('events.full')}
            </div>
            <h3 className="mt-3 text-lg font-semibold">{event.name}</h3>
            <p className="mt-1 text-sm text-white/60">{event.location}</p>
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
