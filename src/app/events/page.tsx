"use client";

import { useEffect, useState } from "react";
import type { EventItem } from "@/lib/db";

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then(setEvents)
      .catch(() => setEvents([]));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">活动预告</h1>
        <p className="mt-2 text-sm text-white/60">选择适合你的场次，名额有限。</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {events.map((event) => (
          <div key={event.id} className="neon-card p-5">
            <div className="text-xs uppercase text-cyan-300">{event.status}</div>
            <h3 className="mt-3 text-lg font-semibold">{event.title}</h3>
            <p className="mt-1 text-sm text-white/60">{event.location}</p>
            <div className="mt-4 flex items-center justify-between text-xs text-white/60">
              <span>
                {event.date} · {event.time}
              </span>
              <span className="text-pink-300">{event.price}</span>
            </div>
          </div>
        ))}
        {!events.length && <div className="text-white/60">暂无活动</div>}
      </div>
    </div>
  );
}
