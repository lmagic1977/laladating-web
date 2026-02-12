'use client';
import { useLanguage } from '@/lib/LanguageContext';

export default function AdminPage() {
  const { t } = useLanguage();
  
  const stats = [
    { title: t('admin.events'), value: '3', icon: '📅' },
    { title: t('admin.registrations'), value: '127', icon: '📝' },
    { title: t('admin.attendees'), value: '89', icon: '👥' },
  ];

  const events = [
    { title: t('event.beach_20_30'), date: '2024-02-15', registered: '45/80', status: t('events.open') },
    { title: t('event.weekend_25_35'), date: '2024-02-22', registered: '52/80', status: t('events.open') },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">{t('admin.title')}</h1>
        <button className="neon-button">
          + {t('admin.add_event')}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.title} className="neon-card p-6 text-center">
            <div className="text-4xl mb-2">{stat.icon}</div>
            <div className="text-3xl font-bold text-yellow-300">{stat.value}</div>
            <div className="mt-1 text-white/60 text-sm">{stat.title}</div>
          </div>
        ))}
      </div>

      {/* Events Table */}
      <div className="neon-card p-6">
        <h2 className="text-xl font-semibold mb-6">{t('admin.events')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/60 border-b border-white/10">
                <th className="pb-3 pr-4 font-medium">{t('events.all')}</th>
                <th className="pb-3 pr-4 font-medium">{t('common.date')}</th>
                <th className="pb-3 pr-4 font-medium">{t('common.registrations')}</th>
                <th className="pb-3 font-medium">{t('common.status')}</th>
                <th className="pb-3 text-right font-medium">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event, idx) => (
                <tr key={idx} className="border-b border-white/5">
                  <td className="py-4 pr-4 text-white">{event.title}</td>
                  <td className="py-4 pr-4 text-white/70">{event.date}</td>
                  <td className="py-4 pr-4 text-white/70">{event.registered}</td>
                  <td className="py-4">
                    <span className="inline-block px-3 py-1 rounded-full bg-cyan-300/20 text-cyan-300 text-xs font-medium">
                      {event.status}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <button className="text-white/60 hover:text-white mr-3">{t('common.edit')}</button>
                    <button className="text-red-400 hover:text-red-300">{t('common.delete')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Registrations */}
      <div className="neon-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">{t('admin.pending_reviews')}</h2>
          <span className="bg-yellow-300/20 text-yellow-300 px-3 py-1 rounded-full text-xs">
            5 {t('admin.new')}
          </span>
        </div>
        <div className="text-center py-8 text-white/40">
          {t('admin.no_pending')}
        </div>
      </div>
    </div>
  );
}
