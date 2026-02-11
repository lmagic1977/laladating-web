"use client";

import { useEffect, useState } from "react";
import type { AdminUser, Attendee, EventItem, Registration } from "@/lib/db";

export default function AdminPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [regs, setRegs] = useState<Registration[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);

  const refresh = async () => {
    const [eventsData, attendeeData, regData, adminData] = await Promise.all([
      fetch("/api/events").then((res) => res.json()),
      fetch("/api/attendees").then((res) => res.json()),
      fetch("/api/registrations").then((res) => res.json()),
      fetch("/api/admins").then((res) => res.json()),
    ]);
    setEvents(eventsData);
    setAttendees(attendeeData);
    setRegs(regData);
    setAdmins(adminData);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleAddEvent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: `hb-${Date.now()}`,
        title: data.get("title"),
        date: data.get("date"),
        time: data.get("time"),
        location: data.get("location"),
        price: data.get("price"),
        seats: Number(data.get("seats")),
        status: data.get("status"),
      }),
    });
    form.reset();
    refresh();
  };

  const handleEditEvent = async (item: EventItem) => {
    const title = prompt("Title", item.title) || item.title;
    const date = prompt("Date", item.date) || item.date;
    const time = prompt("Time", item.time) || item.time;
    const location = prompt("Location", item.location) || item.location;
    const price = prompt("Price", item.price) || item.price;
    const seats = Number(prompt("Seats", String(item.seats)) || item.seats);
    const status = prompt("Status (Open/Waitlist/Closed)", item.status) || item.status;
    await fetch(`/api/events/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, date, time, location, price, seats, status }),
    });
    refresh();
  };

  const handleDeleteEvent = async (id: string) => {
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    refresh();
  };

  const handleUpdateAttendee = async (attendee: Attendee, status: Attendee["status"]) => {
    await fetch(`/api/attendees/${attendee.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    refresh();
  };

  const handleEditAttendee = async (attendee: Attendee) => {
    const name = prompt("Name", attendee.name) || attendee.name;
    const age = Number(prompt("Age", String(attendee.age)) || attendee.age);
    const job = prompt("Job", attendee.job) || attendee.job;
    const interests = prompt("Interests", attendee.interests) || attendee.interests;
    await fetch(`/api/attendees/${attendee.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, age, job, interests }),
    });
    refresh();
  };

  const handleAddAdmin = async () => {
    const name = prompt("Admin Name");
    const email = prompt("Admin Email");
    const role = prompt("Role (super/manager/staff)", "manager");
    if (!name || !email || !role) return;
    await fetch("/api/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: `admin-${Date.now()}`,
        name,
        email,
        role,
      }),
    });
    refresh();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">管理后台</h1>
        <p className="mt-2 text-sm text-white/60">活动管理、报名审核、管理员配置。</p>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="neon-card p-6">
          <h2 className="text-lg font-semibold">新增活动</h2>
          <form className="mt-4 space-y-3" onSubmit={handleAddEvent}>
            <input name="title" placeholder="海边夜场 · 20-30" className="w-full rounded-xl px-3 py-2 neon-input" required />
            <div className="grid gap-3 md:grid-cols-2">
              <input name="date" type="date" className="w-full rounded-xl px-3 py-2 neon-input" required />
              <input name="time" type="time" className="w-full rounded-xl px-3 py-2 neon-input" required />
            </div>
            <input name="location" placeholder="Huntington Beach" className="w-full rounded-xl px-3 py-2 neon-input" required />
            <div className="grid gap-3 md:grid-cols-2">
              <input name="price" placeholder="$39" className="w-full rounded-xl px-3 py-2 neon-input" required />
              <input name="seats" type="number" placeholder="60" className="w-full rounded-xl px-3 py-2 neon-input" required />
            </div>
            <select name="status" className="w-full rounded-xl px-3 py-2 neon-input">
              <option>Open</option>
              <option>Waitlist</option>
              <option>Closed</option>
            </select>
            <button className="rounded-full px-4 py-2 text-sm font-semibold neon-button" type="submit">
              新增活动
            </button>
          </form>
        </div>

        <div className="neon-card p-6">
          <h2 className="text-lg font-semibold">活动列表</h2>
          <div className="mt-4 space-y-3">
            {events.map((event) => (
              <div key={event.id} className="rounded-xl border border-white/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold">{event.title}</div>
                    <div className="text-xs text-white/60">
                      {event.date} {event.time} · {event.location}
                    </div>
                  </div>
                  <div className="text-xs text-pink-300">{event.price}</div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <button className="rounded-full border border-white/20 px-3 py-1" onClick={() => handleEditEvent(event)}>
                    编辑
                  </button>
                  <button className="rounded-full border border-red-400/40 px-3 py-1 text-red-200" onClick={() => handleDeleteEvent(event.id)}>
                    删除
                  </button>
                </div>
              </div>
            ))}
            {!events.length && <div className="text-white/60">暂无活动</div>}
          </div>
        </div>
      </section>

      <section className="neon-card p-6">
        <h2 className="text-lg font-semibold">报名审核</h2>
        <div className="mt-4 space-y-3">
          {attendees.map((attendee) => (
            <div key={attendee.id} className="rounded-xl border border-white/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-semibold">{attendee.name}</div>
                  <div className="text-xs text-white/60">
                    {attendee.age} · {attendee.job} · {attendee.interests}
                  </div>
                </div>
                <div className="text-xs text-cyan-300">{attendee.status}</div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <button className="rounded-full border border-white/20 px-3 py-1" onClick={() => handleUpdateAttendee(attendee, "approved")}
                >
                  通过
                </button>
                <button className="rounded-full border border-white/20 px-3 py-1" onClick={() => handleEditAttendee(attendee)}>
                  编辑
                </button>
                <button className="rounded-full border border-red-400/40 px-3 py-1 text-red-200" onClick={() => handleUpdateAttendee(attendee, "blacklist")}
                >
                  拉黑
                </button>
              </div>
            </div>
          ))}
          {!attendees.length && <div className="text-white/60">暂无报名</div>}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="neon-card p-6">
          <h2 className="text-lg font-semibold">报名记录</h2>
          <div className="mt-4 space-y-3 text-sm text-white/70">
            {regs.map((reg) => (
              <div key={reg.id} className="rounded-xl border border-white/10 p-3">
                <div>报名ID: {reg.id}</div>
                <div>活动: {reg.eventId}</div>
                <div>支付: {reg.payment}</div>
                <div>时间: {new Date(reg.createdAt).toLocaleString()}</div>
              </div>
            ))}
            {!regs.length && <div className="text-white/60">暂无记录</div>}
          </div>
        </div>
        <div className="neon-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">管理员</h2>
            <button className="rounded-full px-3 py-1 text-xs neon-button" onClick={handleAddAdmin}>
              新增管理员
            </button>
          </div>
          <div className="mt-4 space-y-3 text-sm text-white/70">
            {admins.map((admin) => (
              <div key={admin.id} className="rounded-xl border border-white/10 p-3">
                <div className="font-semibold">{admin.name}</div>
                <div>{admin.email}</div>
                <div className="text-xs text-white/60">{admin.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
