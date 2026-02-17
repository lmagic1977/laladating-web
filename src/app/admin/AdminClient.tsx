'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';

interface Event {
  id: number | string;
  name: string;
  date: string;
  time: string;
  location: string;
  price: string;
  age_range: string;
  max_participants: number;
  organizer_name?: string;
  organizer_phone?: string;
  status: 'active' | 'closed';
}

interface Registration {
  id: number;
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
  looking_for: string;
  event_id: number;
  created_at: string;
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
    organizerName: '',
    organizerPhone: '',
    maxParticipants: 20,
  });

  useEffect(() => {
    const loadEvents = async () => {
      const res = await fetch('/api/events', { cache: 'no-store' });
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    };

    const loadRegistrations = async () => {
      const res = await fetch('/api/registrations', { cache: 'no-store' });
      const data = await res.json();
      setRegistrations(Array.isArray(data) ? data : []);
    };

    loadEvents();
    loadRegistrations();
  }, [t]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });

      if (!response.ok) {
        const text = await response.text();
        let message = '';
        try {
          const parsed = JSON.parse(text) as { error?: string; message?: string; details?: string };
          message = parsed.error || parsed.message || parsed.details || '';
        } catch {
          message = text;
        }
        alert(message || `Save failed (${response.status})`);
        return;
      }

      const created: Event = await response.json();
      setEvents((prev) => [...prev, created]);
      setShowCreateForm(false);
      setNewEvent({
        name: '',
        date: '',
        time: '',
        location: '',
        price: '',
        ageRange: '',
        organizerName: '',
        organizerPhone: '',
        maxParticipants: 20,
      });
    } catch (error) {
      alert(`Network error: ${String(error)}`);
    }
  };

  const handleDeleteEvent = async (id: number | string) => {
    const response = await fetch(`/api/events/${id}`, { method: 'DELETE' });
    if (!response.ok) return;
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Age', 'Gender', 'Looking For', 'Event ID', 'Created At'];
    const rows = registrations.map((r) =>
      [r.name, r.email, r.phone, r.age, r.gender, r.looking_for, r.event_id, r.created_at].join(',')
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
            <div>
              <label className="block text-sm font-medium mb-2">组织人</label>
              <input
                type="text"
                value={newEvent.organizerName}
                onChange={(e) => setNewEvent({ ...newEvent, organizerName: e.target.value })}
                className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2 text-white focus:border-pink-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">组织人电话</label>
              <input
                type="text"
                value={newEvent.organizerPhone}
                onChange={(e) => setNewEvent({ ...newEvent, organizerPhone: e.target.value })}
                className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2 text-white focus:border-pink-500 focus:outline-none"
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
