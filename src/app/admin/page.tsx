'use client';
import { useLanguage } from '@/lib/LanguageContext';

export default function AdminPage() {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold">{t('admin.title')}</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { title: t('admin.events'), value: '3', icon: '📅' },
          { title: t('admin.registrations'), value: '127', icon: '📝' },
          { title: t('admin.attendees'), value: '89', icon: '👥' },
        ].map((stat) => (
          <div key={stat.title} className="neon-card p-6 text-center">
            <div className="text-4xl">{stat.icon}</div>
            <div className="mt-2 text-3xl font-bold text-yellow-300">{stat.value}</div>
            <div className="mt-1 text-white/60">{stat.title}</div>
          </div>
        ))}
      </div>
      <div className="neon-card p-6">
        <h2 className="text-xl font-semibold mb-4">{t('admin.events')}</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-white/60 border-b border-white/10">
              <th className="text-left pb-3">{t('events.all')}</th>
              <th className="text-left pb-3">{t('common.date')}</th>
              <th className="text-left pb-3">{t('common.registrations')}</th>
              <th className="text-left pb-3">{t('events.open')}</th>
            </tr>
          </thead>
          <tbody>
            {[
              { title: t('event.beach_20_30'), date: '2024-02-15', registered: '45/80' },
              { title: t('event.weekend_25_35'), date: '2024-02-22', registered: '52/80' },
            ].map((event) => (
              <tr key={event.title} className="border-b border-white/5">
                <td className="py-3">{event.title}</td>
                <td className="py-3">{event.date}</td>
                <td className="py-3">{event.registered}</td>
                <td className="py-3">
                  <span className="px-2 py-1 rounded bg-cyan-300/20 text-cyan-300 text-xs">
                    {t('events.open')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
