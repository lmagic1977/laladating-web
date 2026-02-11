"use client";

import { useEffect, useState } from "react";
import type { Attendee, EventItem } from "@/lib/db";

export default function OnsitePage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [eventId, setEventId] = useState<string>("");

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        setEvents(data);
        setEventId(data[0]?.id || "");
      });
    fetch("/api/attendees")
      .then((res) => res.json())
      .then(setAttendees);
  }, []);

  const list = attendees.filter((a) => a.status === "approved" && (!eventId || a.eventId === eventId));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">现场模式</h1>
          <p className="mt-2 text-sm text-white/60">仅显示本场参会者信息。</p>
        </div>
        <select
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="rounded-full px-4 py-2 text-sm neon-input"
        >
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {list.map((attendee, index) => (
          <div key={attendee.id} className="neon-card p-5">
            <h3 className="text-lg font-semibold">
              {String(index + 1).padStart(2, "0")} · {attendee.name}
            </h3>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/70">
              <span className="rounded-full border border-white/10 px-3 py-1">{attendee.age}</span>
              <span className="rounded-full border border-white/10 px-3 py-1">{attendee.job}</span>
              {attendee.interests
                .split(",")
                .slice(0, 3)
                .map((tag) => (
                  <span key={tag} className="rounded-full border border-white/10 px-3 py-1">
                    {tag.trim()}
                  </span>
                ))}
            </div>
            <p className="mt-3 text-sm text-white/60">{attendee.intro}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="rounded-full px-4 py-2 text-xs font-semibold neon-button">心动</button>
              <button className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold">
                投票
              </button>
              <button className="rounded-full px-4 py-2 text-xs text-white/60">略过</button>
            </div>
          </div>
        ))}
        {!list.length && <div className="text-white/60">暂无已审核参会者</div>}
      </div>
    </div>
  );
}
