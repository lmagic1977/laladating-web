'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';

interface EventItem {
  id: number | string;
  name: string;
  date: string;
  time: string;
  location: string;
  event_code?: string;
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
  event_id: number | string;
  headshot_url?: string;
  created_at: string;
  status?: string;
}

interface Member {
  id: string;
  email: string;
  name?: string;
  created_at?: string;
  wallet_balance?: number;
  profile?: {
    age?: number;
    job?: string;
    interests?: string;
    zodiac?: string;
    height_cm?: number;
    body_type?: string;
    headshot_url?: string;
    fullshot_url?: string;
    photos?: string[];
  } | null;
}

type TabType = 'events' | 'registrations' | 'members';

const EMPTY_FORM = {
  name: '',
  date: '',
  time: '',
  location: '',
  price: '',
  ageRange: '',
  organizerName: '',
  organizerPhone: '',
  maxParticipants: 20,
};

export default function AdminPage() {
  const { t } = useLanguage();
  const toEnglish = (message: unknown) => {
    const text = String(message || '');
    const parts = text.split(/\s*\/\s*/);
    const english = parts.find((p) => /[A-Za-z]/.test(p));
    return (english || text).trim();
  };
  const [activeTab, setActiveTab] = useState<TabType>('events');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [openMemberId, setOpenMemberId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventKeyword, setEventKeyword] = useState('');
  const [eventStatusFilter, setEventStatusFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [newEvent, setNewEvent] = useState(EMPTY_FORM);
  const [cancelingRegistrationId, setCancelingRegistrationId] = useState<string>('');
  const [memberActionLoadingId, setMemberActionLoadingId] = useState<string>('');
  const [resetPasswords, setResetPasswords] = useState<Record<string, string>>({});
  const [topupValues, setTopupValues] = useState<Record<string, string>>({});

  const loadEvents = async () => {
    const res = await fetch('/api/events', { cache: 'no-store' });
    const data = await res.json();
    const rows = Array.isArray(data) ? data : [];
    rows.sort((a, b) => {
      if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
      const ta = new Date(`${a.date}T${a.time || '00:00'}`).getTime() || 0;
      const tb = new Date(`${b.date}T${b.time || '00:00'}`).getTime() || 0;
      return tb - ta;
    });
    setEvents(rows);
  };

  const loadRegistrations = async () => {
    const res = await fetch('/api/registrations', { cache: 'no-store' });
    const data = await res.json();
    setRegistrations(Array.isArray(data) ? data : []);
  };

  const loadMembers = async () => {
    const res = await fetch('/api/admin/members', { cache: 'no-store' });
    const data = await res.json().catch(() => []);
    setMembers(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    loadEvents();
    loadRegistrations();
    loadMembers();
  }, [t]);

  const stats = useMemo(() => {
    const activeEvents = events.filter((e) => e.status === 'active').length;
    const closedEvents = events.filter((e) => e.status === 'closed').length;
    const activeRegs = registrations.filter((r) => !String(r.status || '').startsWith('cancelled')).length;
    return {
      totalEvents: events.length,
      activeEvents,
      closedEvents,
      registrations: activeRegs,
      members: members.length,
    };
  }, [events, registrations, members]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (eventStatusFilter !== 'all' && event.status !== eventStatusFilter) return false;
      if (!eventKeyword.trim()) return true;
      const q = eventKeyword.toLowerCase();
      return (
        event.name.toLowerCase().includes(q) ||
        event.location.toLowerCase().includes(q) ||
        String(event.event_code || '').toLowerCase().includes(q)
      );
    });
  }, [events, eventKeyword, eventStatusFilter]);

  const resetForm = () => {
    setNewEvent(EMPTY_FORM);
    setEditingEventId(null);
    setShowCreateForm(false);
  };

  const handleCreateOrUpdateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const statusFromButton = submitter?.dataset?.status === 'closed' ? 'closed' : 'active';
    const payload = {
      name: newEvent.name,
      date: newEvent.date,
      time: newEvent.time,
      location: newEvent.location,
      price: newEvent.price,
      ageRange: newEvent.ageRange,
      organizerName: newEvent.organizerName,
      organizerPhone: newEvent.organizerPhone,
      maxParticipants: newEvent.maxParticipants,
      status: statusFromButton,
    };

    const endpoint = editingEventId ? `/api/events/${editingEventId}` : '/api/events';
    const method = editingEventId ? 'PUT' : 'POST';
    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      alert(toEnglish(data?.error || (editingEventId ? 'Failed to update event' : 'Failed to create event')));
      return;
    }
    await loadEvents();
    resetForm();
  };

  const handleEditEvent = (event: EventItem) => {
    setEditingEventId(String(event.id));
    setShowCreateForm(true);
    setNewEvent({
      name: event.name,
      date: event.date,
      time: event.time,
      location: event.location,
      price: event.price,
      ageRange: event.age_range,
      organizerName: event.organizer_name || '',
      organizerPhone: event.organizer_phone || '',
      maxParticipants: event.max_participants || 20,
    });
  };

  const handleToggleEventStatus = async (event: EventItem) => {
    const next = event.status === 'active' ? 'closed' : 'active';
    const ok = window.confirm(next === 'closed' ? 'Unpublish this event? It will be hidden from frontend.' : 'Publish this event?');
    if (!ok) return;
    const response = await fetch(`/api/events/${event.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: next,
        event_code: event.event_code || '',
        name: event.name,
        date: event.date,
        time: event.time,
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      alert(`Failed to update status: ${text}`);
      return;
    }
    await loadEvents();
  };

  const handleGenerateEventCode = async (event: EventItem) => {
    const ok = window.confirm('Regenerate event code for this event?');
    if (!ok) return;
    const response = await fetch(`/api/events/${event.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'regenerate_code', date: event.date, location: event.location }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      alert(toEnglish(data?.error || 'Failed to generate event code'));
      return;
    }
    await loadEvents();
    if (data?.event_code) {
      try {
        await navigator.clipboard.writeText(String(data.event_code));
      } catch {
        // ignore clipboard errors
      }
      alert(`New event code: ${data.event_code}`);
    }
  };

  const handleCopyEventCode = async (code?: string) => {
    const value = String(code || '').trim();
    if (!value) {
      alert('No code for this event yet');
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      alert(`Copied event code: ${value}`);
    } catch {
      alert('Copy failed. Please copy manually.');
    }
  };

  const handleDuplicateEvent = async (event: EventItem) => {
    const ok = window.confirm(`Duplicate event: ${event.name}?`);
    if (!ok) return;
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `${event.name} (Copy)`,
        date: event.date,
        time: event.time,
        location: event.location,
        price: event.price,
        ageRange: event.age_range,
        organizerName: event.organizer_name || '',
        organizerPhone: event.organizer_phone || '',
        maxParticipants: event.max_participants || 20,
        status: 'closed',
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      alert(toEnglish(data?.error || 'Failed to duplicate event'));
      return;
    }
    await loadEvents();
    alert('Event duplicated successfully (default status: unpublished)');
  };

  const handleForceCancel = async (registrationId: number) => {
    const ok = window.confirm('Cancel this participant and refund credits?');
    if (!ok) return;
    setCancelingRegistrationId(String(registrationId));
    try {
      const response = await fetch('/api/admin/enrollments/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId: String(registrationId) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        alert(toEnglish(data?.error || 'Cancellation failed'));
        return;
      }
      await loadRegistrations();
    } finally {
      setCancelingRegistrationId('');
    }
  };

  const handleResetPassword = async (member: Member) => {
    const newPassword = String(resetPasswords[member.id] || '').trim();
    if (!newPassword || newPassword.length < 6) {
      alert('New password must be at least 6 characters');
      return;
    }
    const ok = window.confirm(`Reset password for this member?\n${member.email}`);
    if (!ok) return;
    setMemberActionLoadingId(member.id);
    try {
      const res = await fetch('/api/admin/members/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: member.id, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(toEnglish(data?.error || 'Failed to reset password'));
        return;
      }
      setResetPasswords((prev) => ({ ...prev, [member.id]: '' }));
      alert('Password reset completed');
    } finally {
      setMemberActionLoadingId('');
    }
  };

  const handleMemberTopup = async (member: Member) => {
    const amount = Number(topupValues[member.id] || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      alert('Invalid top-up amount');
      return;
    }
    const ok = window.confirm(`Top up member wallet by $${amount}?\n${member.email}`);
    if (!ok) return;
    setMemberActionLoadingId(member.id);
    try {
      const res = await fetch('/api/admin/members/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: member.id, amount }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(toEnglish(data?.error || 'Top-up failed'));
        return;
      }
      await loadMembers();
      setTopupValues((prev) => ({ ...prev, [member.id]: '' }));
      alert('Top-up successful');
    } finally {
      setMemberActionLoadingId('');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Age', 'Gender', 'Status', 'Event ID', 'Created At'];
    const rows = registrations.map((r) =>
      [r.name, r.email, r.phone, r.age, r.gender, r.status || 'paid', r.event_id, r.created_at].join(',')
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
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-5">
        <MetricCard title="Total Events" value={stats.totalEvents} tone="pink" />
        <MetricCard title="Published" value={stats.activeEvents} tone="green" />
        <MetricCard title="Unpublished" value={stats.closedEvents} tone="yellow" />
        <MetricCard title="Active Registrations" value={stats.registrations} tone="cyan" />
        <MetricCard title="Total Members" value={stats.members} tone="purple" />
      </div>

      <div className="neon-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <TabButton active={activeTab === 'events'} onClick={() => setActiveTab('events')} label="Event Management" />
            <TabButton active={activeTab === 'registrations'} onClick={() => setActiveTab('registrations')} label={`Registrations (${registrations.length})`} />
            <TabButton active={activeTab === 'members'} onClick={() => setActiveTab('members')} label={`Members (${members.length})`} />
          </div>
          <div className="flex gap-2">
            {activeTab === 'events' && (
              <button onClick={() => setShowCreateForm((v) => !v)} className="rounded-full px-4 py-2 text-sm font-semibold neon-button">
                {showCreateForm ? 'Cancel' : editingEventId ? 'Edit Event' : 'Create Event'}
              </button>
            )}
            <button onClick={handleLogout} className="rounded-full border border-white/30 px-4 py-2 text-sm text-white/80 hover:bg-white/10">
              Logout
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'events' && (
        <>
          <div className="neon-card p-4">
            <div className="grid gap-3 md:grid-cols-3">
              <input
                value={eventKeyword}
                onChange={(e) => setEventKeyword(e.target.value)}
                placeholder="Search event name/location/code"
                className="rounded-lg border border-white/20 bg-white/10 px-3 py-2"
              />
              <select
                value={eventStatusFilter}
                onChange={(e) => setEventStatusFilter(e.target.value as 'all' | 'active' | 'closed')}
                className="rounded-lg border border-white/20 bg-white/10 px-3 py-2"
              >
                <option value="all">All Statuses</option>
                <option value="active">Published</option>
                <option value="closed">Unpublished</option>
              </select>
              <div className="text-sm text-white/60 flex items-center">{filteredEvents.length} events</div>
            </div>
          </div>

          {showCreateForm && (
            <form onSubmit={handleCreateOrUpdateEvent} className="neon-card p-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Event Name" value={newEvent.name} onChange={(v) => setNewEvent({ ...newEvent, name: v })} required />
                <Input label="Date" type="date" value={newEvent.date} onChange={(v) => setNewEvent({ ...newEvent, date: v })} required />
                <Input label="Time" type="time" value={newEvent.time} onChange={(v) => setNewEvent({ ...newEvent, time: v })} required />
                <Input label="Location" value={newEvent.location} onChange={(v) => setNewEvent({ ...newEvent, location: v })} required />
                <Input label="Price" value={newEvent.price} onChange={(v) => setNewEvent({ ...newEvent, price: v })} required />
                <Input label="Age Range" value={newEvent.ageRange} onChange={(v) => setNewEvent({ ...newEvent, ageRange: v })} required />
                <Input label="Organizer" value={newEvent.organizerName} onChange={(v) => setNewEvent({ ...newEvent, organizerName: v })} />
                <Input label="Organizer Phone" value={newEvent.organizerPhone} onChange={(v) => setNewEvent({ ...newEvent, organizerPhone: v })} />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  data-status="active"
                  className="rounded-full px-5 py-2 text-sm font-semibold neon-button"
                >
                  {editingEventId ? 'Save and Publish' : 'Create and Publish'}
                </button>
                <button
                  type="submit"
                  data-status="closed"
                  className="rounded-full border border-yellow-500/40 px-4 py-2 text-sm text-yellow-300 hover:bg-yellow-500/10"
                >
                  Save as Unpublished
                </button>
                <button type="button" onClick={resetForm} className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10">
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredEvents.map((event) => (
              <div key={event.id} className="neon-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{event.name}</h3>
                    <p className="mt-1 text-sm text-white/60">{event.date} · {event.time}</p>
                    <p className="text-sm text-white/60">{event.location}</p>
                    <p className="mt-2 text-xs text-cyan-300">Code: {event.event_code || '-'}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs ${event.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-white/15 text-white/70'}`}>
                    {event.status === 'active' ? 'Published' : 'Unpublished'}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <ActionBtn label="Edit" onClick={() => handleEditEvent(event)} />
                  <ActionBtn label={event.status === 'active' ? 'Unpublish' : 'Publish'} onClick={() => handleToggleEventStatus(event)} tone={event.status === 'active' ? 'warn' : 'ok'} />
                  <ActionBtn label="Duplicate" onClick={() => handleDuplicateEvent(event)} />
                  <ActionBtn label="Generate Code" onClick={() => handleGenerateEventCode(event)} />
                  <ActionBtn label="Copy Code" onClick={() => handleCopyEventCode(event.event_code)} />
                  <ActionBtn
                    label={activeEventId === String(event.id) ? 'Hide Participants' : 'View Participants'}
                    onClick={() => setActiveEventId((prev) => (prev === String(event.id) ? null : String(event.id)))}
                  />
                </div>

                {activeEventId === String(event.id) && (
                  <div className="mt-4 border-t border-white/10 pt-3 space-y-2">
                    {registrations
                      .filter((r) => String(r.event_id) === String(event.id) && !String(r.status || '').startsWith('cancelled'))
                      .map((r) => (
                        <div key={r.id} className="flex items-center justify-between rounded-lg border border-white/10 p-2">
                          <div className="flex items-center gap-2">
                            {r.headshot_url ? <img src={r.headshot_url} alt={r.name} className="h-8 w-8 rounded-full object-cover" /> : <div className="h-8 w-8 rounded-full bg-white/10" />}
                            <span className="text-sm">{r.name}</span>
                          </div>
                          <button
                            onClick={() => handleForceCancel(r.id)}
                            disabled={cancelingRegistrationId === String(r.id)}
                            className="rounded-md border border-red-500/30 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                          >
                            {cancelingRegistrationId === String(r.id) ? 'Processing...' : 'Remove'}
                          </button>
                        </div>
                      ))}
                    {!registrations.some((r) => String(r.event_id) === String(event.id) && !String(r.status || '').startsWith('cancelled')) && (
                      <p className="text-sm text-white/50">No participants yet</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'registrations' && (
        <div className="space-y-3">
          <button onClick={handleExportCSV} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/80 hover:bg-white/10">
            Export CSV
          </button>
          <div className="neon-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-white/70">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Age</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-white/5">
                    <td className="px-4 py-3">{reg.name}</td>
                    <td className="px-4 py-3 text-white/70">{reg.email}</td>
                    <td className="px-4 py-3 text-white/70">{reg.phone}</td>
                    <td className="px-4 py-3 text-white/70">{reg.age}</td>
                    <td className="px-4 py-3 text-white/70">{reg.status || 'paid'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleForceCancel(reg.id)}
                        disabled={cancelingRegistrationId === String(reg.id)}
                        className="rounded-lg border border-red-500/30 px-3 py-1 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                      >
                        {cancelingRegistrationId === String(reg.id) ? 'Processing...' : 'Force cancel + refund'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="neon-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{member.name || member.email}</p>
                  <p className="text-sm text-white/60">{member.email}</p>
                  <p className="mt-1 text-sm text-cyan-300">Wallet Balance: ${Number(member.wallet_balance || 0).toFixed(2)}</p>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      value={resetPasswords[member.id] || ''}
                      onChange={(e) => setResetPasswords((prev) => ({ ...prev, [member.id]: e.target.value }))}
                      placeholder="New password (min 6 chars)"
                      className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm"
                    />
                    <button
                      onClick={() => handleResetPassword(member)}
                      disabled={memberActionLoadingId === member.id}
                      className="rounded-lg border border-white/20 px-3 py-2 text-xs hover:bg-white/10 disabled:opacity-50"
                    >
                      Reset Password
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={topupValues[member.id] || ''}
                      onChange={(e) => setTopupValues((prev) => ({ ...prev, [member.id]: e.target.value }))}
                      placeholder="Top-up amount"
                      className="w-28 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm"
                    />
                    <button
                      onClick={() => handleMemberTopup(member)}
                      disabled={memberActionLoadingId === member.id}
                      className="rounded-lg border border-pink-500/30 px-3 py-2 text-xs text-pink-300 hover:bg-pink-500/10 disabled:opacity-50"
                    >
                      Top Up
                    </button>
                    <button
                      onClick={() => setOpenMemberId((prev) => (prev === member.id ? null : member.id))}
                      className="rounded-lg border border-cyan-500/30 px-3 py-2 text-xs text-cyan-200 hover:bg-cyan-500/10"
                    >
                      {openMemberId === member.id ? 'Hide Profile' : 'View Profile'}
                    </button>
                  </div>
                </div>
              </div>

              {openMemberId === member.id && (
                <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="grid gap-2 text-sm md:grid-cols-2">
                    <p>Age: {member.profile?.age || '-'}</p>
                    <p>Job: {member.profile?.job || '-'}</p>
                    <p>Interests: {member.profile?.interests || '-'}</p>
                    <p>Zodiac: {member.profile?.zodiac || '-'}</p>
                    <p>Height: {member.profile?.height_cm || '-'} cm</p>
                    <p>Body Type: {member.profile?.body_type || '-'}</p>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <ImageBox title="Headshot" src={member.profile?.headshot_url} rounded />
                    <ImageBox title="Full Body" src={member.profile?.fullshot_url} />
                    <div>
                      <p className="mb-2 text-xs text-white/60">More Photos</p>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(member.profile?.photos) && member.profile?.photos?.length ? (
                          member.profile.photos.slice(0, 6).map((url, idx) => (
                            <img key={idx} src={url} alt={`photo-${idx}`} className="h-14 w-14 rounded object-cover" />
                          ))
                        ) : (
                          <span className="text-xs text-white/50">None</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {!members.length && <div className="neon-card p-6 text-white/60">No members yet</div>}
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, value, tone }: { title: string; value: number; tone: 'pink' | 'green' | 'yellow' | 'cyan' | 'purple' }) {
  const toneMap = {
    pink: 'text-pink-300 border-pink-500/20',
    green: 'text-green-300 border-green-500/20',
    yellow: 'text-yellow-300 border-yellow-500/20',
    cyan: 'text-cyan-300 border-cyan-500/20',
    purple: 'text-fuchsia-300 border-fuchsia-500/20',
  };
  return (
    <div className={`neon-card rounded-xl border p-4 ${toneMap[tone]}`}>
      <p className="text-xs text-white/60">{title}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
        active ? 'bg-pink-500/20 text-pink-300' : 'text-white/70 hover:bg-white/10'
      }`}
    >
      {label}
    </button>
  );
}

function ActionBtn({ label, onClick, tone = 'base' }: { label: string; onClick: () => void; tone?: 'base' | 'warn' | 'ok' }) {
  const cls =
    tone === 'warn'
      ? 'border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/10'
      : tone === 'ok'
      ? 'border-green-500/40 text-green-300 hover:bg-green-500/10'
      : 'border-white/20 text-white/80 hover:bg-white/10';
  return (
    <button onClick={onClick} className={`rounded-lg border px-3 py-2 transition-colors ${cls}`}>
      {label}
    </button>
  );
}

function Input({
  label,
  value,
  onChange,
  required,
  type = 'text',
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-white/70">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2"
      />
    </div>
  );
}

function ImageBox({ title, src, rounded = false }: { title: string; src?: string; rounded?: boolean }) {
  return (
    <div>
      <p className="mb-2 text-xs text-white/60">{title}</p>
      {src ? (
        <img src={src} alt={title} className={`${rounded ? 'h-20 w-20 rounded-full' : 'h-24 w-20 rounded'} object-cover`} />
      ) : (
        <div className={`${rounded ? 'h-20 w-20 rounded-full' : 'h-24 w-20 rounded'} bg-white/10`} />
      )}
    </div>
  );
}
