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
        setAuthError('Please login first');
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
        setAuthError('Permission denied');
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
      setAuthError('Failed to load. Please try again.');
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
    return <div className="text-white/70">Loading event...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="neon-card p-6">
        <h1 className="text-3xl font-semibold text-pink-300">{event.name}</h1>
        <p className="mt-3 text-white/70">
          Time: {event.date} {event.time}
        </p>
        <p className="mt-1 text-white/70">Location: {event.location}</p>
        <p className="mt-1 text-white/70">Organizer: {event.organizer_name || 'TBD'}</p>
        <p className="mt-1 text-white/70">Phone: {event.organizer_phone || 'TBD'}</p>
      </div>

      <div className="neon-card p-6">
        <h2 className="text-2xl font-semibold text-pink-300">Participants</h2>
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
          {!participants.length && <p className="text-white/60">No participants yet</p>}
        </div>
      </div>
    </div>
  );
}
