'use client';

import { useEffect, useMemo, useState } from 'react';

type EventItem = {
  id: string | number;
  name: string;
  date: string;
  time: string;
  location: string;
  price: string;
  organizer_name?: string;
  organizer_phone?: string;
};

type Registration = {
  id: number;
  name: string;
  headshot_url?: string;
  event_id: number | string;
};

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<EventItem | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [authReady, setAuthReady] = useState(false);
  const [canView, setCanView] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const load = async () => {
      const sessionRes = await fetch('/api/user/session', { cache: 'no-store' });
      const sessionData = await sessionRes.json().catch(() => ({}));
      if (!sessionData?.authenticated) {
        setAuthError('请先登录后查看活动详情 / Please login first');
        setAuthReady(true);
        setTimeout(() => {
          window.location.href = '/auth';
        }, 800);
        return;
      }

      const [eventRes, regRes] = await Promise.all([
        fetch('/api/events', { cache: 'no-store' }),
        fetch(`/api/registrations?event_id=${params.id}`, { cache: 'no-store' }),
      ]);
      const eventRows = await eventRes.json();
      const regRows = await regRes.json().catch(() => []);
      if (!regRes.ok) {
        setAuthError('无权限查看报名详情 / Permission denied');
        setAuthReady(true);
        return;
      }
      const found = Array.isArray(eventRows)
        ? eventRows.find((e) => String(e.id) === String(params.id))
        : null;
      setEvent(found || null);
      setRegistrations(Array.isArray(regRows) ? regRows : []);
      setCanView(true);
      setAuthReady(true);
    };
    load().catch(() => {
      setAuthError('加载失败，请稍后重试 / Failed to load');
      setAuthReady(true);
    });
  }, [params.id]);

  const participants = useMemo(
    () => registrations.filter((r) => String(r.event_id) === String(params.id)),
    [registrations, params.id]
  );

  if (!authReady) {
    return <div className="text-white/70">Loading...</div>;
  }

  if (!canView) {
    return <div className="rounded-lg border border-red-500/40 bg-red-500/20 p-4 text-red-200">{authError}</div>;
  }

  if (!event) {
    return <div className="text-white/70">活动加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="neon-card p-6">
        <h1 className="text-3xl font-semibold text-pink-300">{event.name}</h1>
        <p className="mt-3 text-white/70">
          时间：{event.date} {event.time}
        </p>
        <p className="mt-1 text-white/70">地点：{event.location}</p>
        <p className="mt-1 text-white/70">组织人：{event.organizer_name || '待补充'}</p>
        <p className="mt-1 text-white/70">联系电话：{event.organizer_phone || '待补充'}</p>
      </div>

      <div className="neon-card p-6">
        <h2 className="text-2xl font-semibold text-pink-300">参与者名单</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {participants.map((person) => (
            <div key={person.id} className="rounded-xl border border-white/10 p-4 text-center">
              {person.headshot_url ? (
                <img
                  src={person.headshot_url}
                  alt={person.name}
                  className="mx-auto h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <div className="mx-auto h-20 w-20 rounded-full bg-white/10" />
              )}
              <p className="mt-3 text-white">{person.name}</p>
            </div>
          ))}
          {!participants.length && <p className="text-white/60">暂无报名用户</p>}
        </div>
      </div>
    </div>
  );
}
