'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';

interface Event {
  id: number;
  name: string;
  date: string;
  time: string;
  location: string;
  price: string;
  ageRange: string;
  maxParticipants: number;
  status: 'active' | 'closed';
}

interface Registration {
  id: number;
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
  lookingFor: string;
  eventId: number;
  createdAt: string;
}

export default function AdminPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'events' | 'registrations'>('events');
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: '',
    date: '',
    time: '',
    location: '',
    price: '',
    ageRange: '',
    maxParticipants: 20,
  });

  useEffect(() => {
    // Load events from localStorage or use defaults
    const savedEvents = localStorage.getItem('lala_events');
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    } else {
      const defaultEvents: Event[] = [
        {
          id: 1,
          name: t('event.beach_20_30'),
          date: '2024-02-15',
          time: '20:00',
          location: 'Huntington Beach',
          price: '$39',
          ageRange: '20-30',
          maxParticipants: 20,
          status: 'active',
        },
        {
          id: 2,
          name: t('event.weekend_25_35'),
          date: '2024-02-22',
          time: '20:00',
          location: 'Huntington Beach',
          price: '$39',
          ageRange: '25-35',
          maxParticipants: 20,
          status: 'active',
        },
      ];
      setEvents(defaultEvents);
      localStorage.setItem('lala_events', JSON.stringify(defaultEvents));
    }

    // Load registrations
    const savedRegs = localStorage.getItem('lala_registrations');
    if (savedRegs) {
      setRegistrations(JSON.parse(savedRegs));
    }
  }, [t]);

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const event: Event = {
      id: Date.now(),
      ...newEvent,
      status: 'active',
    };
    const updatedEvents = [...events, event];
    setEvents(updatedEvents);
    localStorage.setItem('lala_events', JSON.stringify(updatedEvents));
    setShowCreateForm(false);
    setNewEvent({
      name: '',
      date: '',
      time: '',
      location: '',
      price: '',
      ageRange: '',
      maxParticipants: 20,
    });
  };

  const handleDeleteEvent = (id: number) => {
    const updatedEvents = events.filter((e) => e.id !== id);
    setEvents(updatedEvents);
    localStorage.setItem('lala_events', JSON.stringify(updatedEvents));
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Age', 'Gender', 'Looking For', 'Event ID', 'Created At'];
    const rows = registrations.map((r) =>
      [r.name, r.email, r.phone, r.age, r.gender, r.lookingFor, r.eventId, r.createdAt].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'registrations.csv';
    a.click();
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold">{t('admin.title')}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="rounded-full px-4 py-2 text-sm font-semibold neon-button"
          >
            {showCreateForm ? t('common.cancel') : t('admin.create_event')}
          </button>
          <button
            onClick={handleLogout}
            className="rounded-full px-4 py-2 text-sm font-semibold border border-white/30 text-white/80 hover:bg-white/10"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'events' ? 'bg-pink-500/20 text-pink-300' : 'text-white/60 hover:bg-white/10'
          }`}
        >
          {t('admin.events')}
        </button>
        <button
          onClick={() => setActiveTab('registrations')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'registrations' ? 'bg-pink-500/20 text-pink-300' : 'text-white/60 hover:bg-white/10'
          }`}
        >
          {t('admin.registrations')} ({registrations.length})
        </button>
      </div>

      {/* Create Event Form */}
      {showCreateForm && (
        <form onSubmit={handleCreateEvent} className="neon-card p-6 mb-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">{t('admin.event_name')}</label>
              <input
                type="text"
                value={newEvent.name}
                onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2 text-white focus:border-pink-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('admin.date')}</label>
              <input
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2 text-white focus:border-pink-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('admin.time')}</label>
              <input
                type="time"
                value={newEvent.time}
                onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2 text-white focus:border-pink-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('admin.location')}</label>
              <input
                type="text"
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2 text-white focus:border-pink-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('admin.price')}</label>
              <input
                type="text"
                value={newEvent.price}
                onChange={(e) => setNewEvent({ ...newEvent, price: e.target.value })}
                className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2 text-white focus:border-pink-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('admin.age_range')}</label>
              <input
                type="text"
                value={newEvent.ageRange}
                onChange={(e) => setNewEvent({ ...newEvent, ageRange: e.target.value })}
                placeholder="20-30"
                className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2 text-white focus:border-pink-500 focus:outline-none"
                required
              />
            </div>
          </div>
          <button type="submit" className="rounded-full px-6 py-2 text-sm font-semibold neon-button">
            {t('admin.save')}
          </button>
        </form>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <div key={event.id} className="neon-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{event.name}</h3>
                  <p className="text-sm text-white/60 mt-1">{event.date} · {event.time}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    event.status === 'active'
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {event.status === 'active' ? t('admin.active') : t('admin.closed')}
                </span>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleDeleteEvent(event.id)}
                  className="flex-1 rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  {t('admin.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Registrations Tab */}
      {activeTab === 'registrations' && (
        <div>
          {registrations.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="mb-4 rounded-lg border border-white/20 px-4 py-2 text-sm text-white/70 hover:bg-white/10 transition-colors"
            >
              {t('admin.export')} CSV
            </button>
          )}
          <div className="neon-card overflow-hidden">
            {registrations.length === 0 ? (
              <div className="p-8 text-center text-white/60">{t('common.loading')}</div>
            ) : (
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-white/60">{t('register.name')}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-white/60">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-white/60">{t('register.phone')}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-white/60">{t('register.age')}</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-white/60">{t('register.gender')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {registrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-white/5">
                      <td className="px-4 py-3">{reg.name}</td>
                      <td className="px-4 py-3 text-white/60">{reg.email}</td>
                      <td className="px-4 py-3 text-white/60">{reg.phone}</td>
                      <td className="px-4 py-3 text-white/60">{reg.age}</td>
                      <td className="px-4 py-3 text-white/60">{reg.gender}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
