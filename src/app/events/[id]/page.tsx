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

  useEffect(() => {
    const load = async () => {
      const [eventRes, regRes] = await Promise.all([
        fetch('/api/events', { cache: 'no-store' }),
        fetch(`/api/registrations?event_id=${params.id}`, { cache: 'no-store' }),
      ]);
      const eventRows = await eventRes.json();
      const regRows = await regRes.json();
      const found = Array.isArray(eventRows)
        ? eventRows.find((e) => String(e.id) === String(params.id))
        : null;
      setEvent(found || null);
      setRegistrations(Array.isArray(regRows) ? regRows : []);
    };
    load();
  }, [params.id]);

  const participants = useMemo(
    () => registrations.filter((r) => String(r.event_id) === String(params.id)),
    [registrations, params.id]
  );

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
