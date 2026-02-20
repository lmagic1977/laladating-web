'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';

interface Event {
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
  payment?: string;
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

export default function AdminPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'events' | 'registrations' | 'members'>('events');
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [cancelingRegistrationId, setCancelingRegistrationId] = useState<string>('');
  const [memberActionLoadingId, setMemberActionLoadingId] = useState<string>('');
  const [resetPasswords, setResetPasswords] = useState<Record<string, string>>({});
  const [topupValues, setTopupValues] = useState<Record<string, string>>({});
  const [openMemberId, setOpenMemberId] = useState<string | null>(null);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
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

    loadEvents();
    loadRegistrations();
    loadMembers();
  }, [t]);

  const reloadMembers = async () => {
    const res = await fetch('/api/admin/members', { cache: 'no-store' });
    const data = await res.json().catch(() => []);
    setMembers(Array.isArray(data) ? data : []);
  };

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

  const handleToggleEventStatus = async (id: number | string, status: 'active' | 'closed') => {
    const isClosing = status === 'closed';
    const ok = window.confirm(isClosing ? '确认下架该活动？前台将不可见。' : '确认重新上架该活动？');
    if (!ok) return;
    const response = await fetch(`/api/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) return;
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status } : e))
    );
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

  const handleForceCancel = async (registrationId: number) => {
    const ok = window.confirm('确认取消该用户资格并退回额度？');
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
        alert(data?.error || 'Force cancel failed');
        return;
      }
      setRegistrations((prev) =>
        prev.map((item) =>
          item.id === registrationId ? { ...item, status: 'cancelled_by_admin' } : item
        )
      );
    } finally {
      setCancelingRegistrationId('');
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  const handleCopyEventCode = async (code?: string) => {
    const value = String(code || '').trim();
    if (!value) {
      alert('该活动暂无代码');
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      alert(`已复制活动代码: ${value}`);
    } catch {
      alert('复制失败，请手动复制');
    }
  };

  const handleResetPassword = async (member: Member) => {
    const newPassword = String(resetPasswords[member.id] || '').trim();
    if (!newPassword || newPassword.length < 6) {
      alert('新密码至少6位 / Password must be at least 6 characters');
      return;
    }
    const ok = window.confirm(`确认重设该会员密码？\\n${member.email}`);
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
        alert(data?.error || '重设密码失败');
        return;
      }
      setResetPasswords((prev) => ({ ...prev, [member.id]: '' }));
      alert('密码已重设 / Password reset completed');
    } finally {
      setMemberActionLoadingId('');
    }
  };

  const handleMemberTopup = async (member: Member) => {
    const amount = Number(topupValues[member.id] || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      alert('充值金额无效');
      return;
    }
    const ok = window.confirm(`确认给会员充值 $${amount} ?\\n${member.email}`);
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
        alert(data?.error || '充值失败');
        return;
      }
      await reloadMembers();
      setTopupValues((prev) => ({ ...prev, [member.id]: '' }));
      alert('充值成功 / Top-up completed');
    } finally {
      setMemberActionLoadingId('');
    }
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
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'members' ? 'bg-pink-500/20 text-pink-300' : 'text-white/60 hover:bg-white/10'
          }`}
        >
          会员管理 ({members.length})
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
                  <p className="text-xs text-cyan-300 mt-1">Code: {event.event_code || '-'}</p>
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
                  onClick={() => handleCopyEventCode(event.event_code)}
                  className="flex-1 rounded-lg border border-cyan-500/30 px-3 py-2 text-sm text-cyan-200 hover:bg-cyan-500/10 transition-colors"
                >
                  复制代码
                </button>
                <button
                  onClick={() =>
                    setActiveEventId((prev) =>
                      prev === String(event.id) ? null : String(event.id)
                    )
                  }
                  className="flex-1 rounded-lg border border-white/20 px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition-colors"
                >
                  {activeEventId === String(event.id) ? '隐藏参与者' : '查看参与者'}
                </button>
                <button
                  onClick={() =>
                    handleToggleEventStatus(
                      event.id,
                      event.status === 'active' ? 'closed' : 'active'
                    )
                  }
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    event.status === 'active'
                      ? 'border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/10'
                      : 'border-green-500/40 text-green-300 hover:bg-green-500/10'
                  }`}
                >
                  {event.status === 'active' ? '下架活动' : '重新上架'}
                </button>
              </div>
              {activeEventId === String(event.id) && (
                <div className="mt-4 space-y-2 border-t border-white/10 pt-3">
                  {registrations
                    .filter(
                      (reg) =>
                        String(reg.event_id) === String(event.id) &&
                        reg.status !== 'cancelled_by_admin' &&
                        reg.status !== 'cancelled_by_user'
                    )
                    .map((reg) => (
                      <div key={reg.id} className="flex items-center justify-between rounded-lg border border-white/10 p-2">
                        <div className="flex items-center gap-2">
                          {reg.headshot_url ? (
                            <img src={reg.headshot_url} alt={reg.name} className="h-8 w-8 rounded-full object-cover" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-white/10" />
                          )}
                          <span className="text-sm text-white/80">{reg.name}</span>
                        </div>
                        <button
                          onClick={() => handleForceCancel(reg.id)}
                          disabled={cancelingRegistrationId === String(reg.id)}
                          className="rounded-md border border-red-500/30 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-60"
                        >
                          {cancelingRegistrationId === String(reg.id) ? '处理中...' : '取消资格'}
                        </button>
                      </div>
                    ))}
                  {!registrations.some(
                    (reg) =>
                      String(reg.event_id) === String(event.id) &&
                      reg.status !== 'cancelled_by_admin' &&
                      reg.status !== 'cancelled_by_user'
                  ) && <p className="text-sm text-white/50">暂无参与者</p>}
                </div>
              )}
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
                    <th className="px-4 py-3 text-left text-sm font-medium text-white/60">状态</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-white/60">操作</th>
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
                      <td className="px-4 py-3 text-white/60">{reg.status || 'paid'}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleForceCancel(reg.id)}
                          disabled={cancelingRegistrationId === String(reg.id)}
                          className="rounded-lg border border-red-500/30 px-3 py-1 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-60"
                        >
                          {cancelingRegistrationId === String(reg.id) ? '处理中...' : '强制取消并退回'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="space-y-3">
          {members.length === 0 ? (
            <div className="neon-card p-6 text-white/60">暂无会员</div>
          ) : (
            members.map((member) => (
              <div key={member.id} className="neon-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{member.name || member.email}</p>
                    <p className="text-sm text-white/60">{member.email}</p>
                    <p className="text-sm text-cyan-300 mt-1">
                      钱包余额 / Wallet: ${Number(member.wallet_balance || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        value={resetPasswords[member.id] || ''}
                        onChange={(e) =>
                          setResetPasswords((prev) => ({ ...prev, [member.id]: e.target.value }))
                        }
                        placeholder="新密码(至少6位)"
                        className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white"
                      />
                      <button
                        onClick={() => handleResetPassword(member)}
                        disabled={memberActionLoadingId === member.id}
                        className="rounded-lg border border-white/20 px-3 py-2 text-xs text-white/80 hover:bg-white/10 disabled:opacity-60"
                      >
                        重设密码
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setOpenMemberId((prev) => (prev === member.id ? null : member.id))
                        }
                        className="rounded-lg border border-cyan-500/30 px-3 py-2 text-xs text-cyan-200 hover:bg-cyan-500/10"
                      >
                        {openMemberId === member.id ? "收起资料" : "查看资料"}
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={topupValues[member.id] || ''}
                        onChange={(e) =>
                          setTopupValues((prev) => ({ ...prev, [member.id]: e.target.value }))
                        }
                        placeholder="充值金额"
                        className="w-28 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white"
                      />
                      <button
                        onClick={() => handleMemberTopup(member)}
                        disabled={memberActionLoadingId === member.id}
                        className="rounded-lg border border-pink-500/30 px-3 py-2 text-xs text-pink-300 hover:bg-pink-500/10 disabled:opacity-60"
                      >
                        充值
                      </button>
                    </div>
                  </div>
                </div>
                {openMemberId === member.id && (
                  <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="grid gap-3 text-sm md:grid-cols-2">
                      <p>年龄: {member.profile?.age || '-'}</p>
                      <p>工作: {member.profile?.job || '-'}</p>
                      <p>兴趣: {member.profile?.interests || '-'}</p>
                      <p>星座: {member.profile?.zodiac || '-'}</p>
                      <p>身高: {member.profile?.height_cm || '-'} cm</p>
                      <p>身材类型: {member.profile?.body_type || '-'}</p>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div>
                        <p className="mb-2 text-xs text-white/60">头像</p>
                        {member.profile?.headshot_url ? (
                          <img src={member.profile.headshot_url} alt="headshot" className="h-20 w-20 rounded-full object-cover" />
                        ) : (
                          <div className="h-20 w-20 rounded-full bg-white/10" />
                        )}
                      </div>
                      <div>
                        <p className="mb-2 text-xs text-white/60">全身照</p>
                        {member.profile?.fullshot_url ? (
                          <img src={member.profile.fullshot_url} alt="fullshot" className="h-24 w-20 rounded object-cover" />
                        ) : (
                          <div className="h-24 w-20 rounded bg-white/10" />
                        )}
                      </div>
                      <div>
                        <p className="mb-2 text-xs text-white/60">更多照片</p>
                        <div className="flex flex-wrap gap-2">
                          {Array.isArray(member.profile?.photos) && member.profile?.photos?.length ? (
                            member.profile.photos.slice(0, 6).map((url, idx) => (
                              <img key={idx} src={url} alt={`photo-${idx}`} className="h-14 w-14 rounded object-cover" />
                            ))
                          ) : (
                            <span className="text-xs text-white/50">无</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
