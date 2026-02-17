"use client";

import { useEffect, useMemo, useState } from "react";

type EventItem = {
  id: string | number;
  name: string;
  date: string;
  time: string;
  location: string;
  price: string;
  status: "active" | "closed";
};

type Enrollment = {
  id: string;
  eventId: string;
  status: string;
  payment: string;
  createdAt: string;
};

export default function AccountPage() {
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [error, setError] = useState("");
  const [payingId, setPayingId] = useState<string>("");

  const enrollmentMap = useMemo(() => {
    const m = new Set<string>();
    for (const item of enrollments) {
      if (item.status === "paid") m.add(String(item.eventId));
    }
    return m;
  }, [enrollments]);

  const load = async () => {
    const sessionRes = await fetch("/api/user/session", { cache: "no-store" });
    const session = await sessionRes.json();
    if (!session?.authenticated) {
      window.location.href = "/auth";
      return;
    }
    setEmail(session.user.email);

    const [eventsRes, enrollmentsRes] = await Promise.all([
      fetch("/api/events", { cache: "no-store" }),
      fetch("/api/user/enrollments", { cache: "no-store" }),
    ]);
    setEvents(await eventsRes.json());
    setEnrollments(await enrollmentsRes.json());
    setReady(true);
  };

  useEffect(() => {
    load().catch((err) => {
      setError(String(err));
      setReady(true);
    });
  }, []);

  const onLogout = async () => {
    await fetch("/api/user/logout", { method: "POST" });
    window.location.href = "/auth";
  };

  const onPayAndJoin = async (eventId: string | number) => {
    setError("");
    setPayingId(String(eventId));
    try {
      const res = await fetch("/api/user/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: String(eventId) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Payment failed");
        return;
      }
      await load();
      alert("Payment success and registration completed / 支付成功，报名已完成");
    } finally {
      setPayingId("");
    }
  };

  if (!ready) {
    return <div className="text-white/70">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-pink-300">My Account / 我的账户</h1>
          <p className="mt-1 text-sm text-white/60">{email}</p>
        </div>
        <button
          onClick={onLogout}
          className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10"
        >
          Logout / 退出
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/20 p-3 text-sm text-red-200">{error}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {events
          .filter((event) => event.status === "active")
          .map((event) => {
            const joined = enrollmentMap.has(String(event.id));
            return (
              <div key={event.id} className="neon-card p-5">
                <h3 className="text-lg font-semibold">{event.name}</h3>
                <p className="mt-2 text-sm text-white/70">
                  {event.date} · {event.time}
                </p>
                <p className="text-sm text-white/60">{event.location}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-pink-300">{event.price}</span>
                  {joined ? (
                    <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-300">
                      Joined / 已报名
                    </span>
                  ) : (
                    <button
                      onClick={() => onPayAndJoin(event.id)}
                      disabled={payingId === String(event.id)}
                      className="rounded-full px-4 py-2 text-xs font-semibold neon-button disabled:opacity-60"
                    >
                      {payingId === String(event.id)
                        ? "Processing..."
                        : "Pay & Join / 支付并报名"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      <div className="neon-card p-5">
        <h2 className="text-lg font-semibold">My Orders / 我的订单</h2>
        <div className="mt-3 space-y-2 text-sm text-white/70">
          {enrollments.length ? (
            enrollments.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b border-white/10 pb-2">
                <span>Event #{item.eventId}</span>
                <span>{item.payment}</span>
              </div>
            ))
          ) : (
            <p className="text-white/50">No paid enrollments yet / 暂无支付报名</p>
          )}
        </div>
      </div>
    </div>
  );
}
