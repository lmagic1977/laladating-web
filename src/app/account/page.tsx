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
  eventid: string;
  status: string;
  payment: string;
  createdat: string;
};

type WalletState = {
  balance: number;
  passes: Array<{
    packageId: string;
    title: string;
    total: number;
    remaining: number;
    purchasedAt: string;
  }>;
  ledger: Array<{
    id: string;
    type: string;
    amount: number;
    note: string;
    createdAt: string;
  }>;
};

type PassPackage = {
  id: string;
  title: string;
  titleZh: string;
  credits: number;
  price: number;
  originalPrice: number;
};

export default function AccountPage() {
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [error, setError] = useState("");
  const [payingId, setPayingId] = useState<string>("");
  const [wallet, setWallet] = useState<WalletState>({ balance: 0, passes: [], ledger: [] });
  const [packages, setPackages] = useState<PassPackage[]>([]);
  const [topupAmount, setTopupAmount] = useState("100");

  const enrollmentMap = useMemo(() => {
    const m = new Set<string>();
    for (const item of enrollments) {
      if (item.status === "paid") m.add(String(item.eventid));
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

    const [eventsRes, enrollmentsRes, walletRes, packageRes] = await Promise.all([
      fetch("/api/events", { cache: "no-store" }),
      fetch("/api/user/enrollments", { cache: "no-store" }),
      fetch("/api/user/wallet", { cache: "no-store" }),
      fetch("/api/user/packages", { cache: "no-store" }),
    ]);
    setEvents(await eventsRes.json());
    setEnrollments(await enrollmentsRes.json());
    setWallet(await walletRes.json());
    setPackages(await packageRes.json());
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

  const onTopup = async () => {
    setError("");
    const amount = Number(topupAmount);
    if (!amount || amount <= 0) {
      setError("Invalid top-up amount / 充值金额无效");
      return;
    }
    const res = await fetch("/api/user/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.error || "Top-up failed");
      return;
    }
    await load();
  };

  const onBuyPackage = async (packageId: string) => {
    setError("");
    const res = await fetch("/api/user/packages/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.error || "Purchase failed");
      return;
    }
    await load();
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
        <div className="neon-card p-5">
          <h2 className="text-lg font-semibold">Wallet / 钱包</h2>
          <p className="mt-2 text-3xl font-bold text-cyan-300">${wallet.balance.toFixed(2)}</p>
          <div className="mt-4 flex items-center gap-2">
            <input
              value={topupAmount}
              onChange={(e) => setTopupAmount(e.target.value)}
              className="w-32 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm outline-none focus:border-pink-500"
            />
            <button onClick={onTopup} className="rounded-full px-4 py-2 text-xs font-semibold neon-button">
              Top Up / 充值
            </button>
          </div>
        </div>
        <div className="neon-card p-5">
          <h2 className="text-lg font-semibold">My Passes / 我的套餐</h2>
          <div className="mt-2 space-y-2 text-sm text-white/80">
            {wallet.passes.length ? wallet.passes.map((p, idx) => (
              <div key={`${p.packageId}-${idx}`} className="flex items-center justify-between">
                <span>{p.title}</span>
                <span className="text-pink-300">{p.remaining}/{p.total}</span>
              </div>
            )) : <p className="text-white/50">No passes yet / 暂无套餐</p>}
          </div>
        </div>
      </div>

      <div className="neon-card p-5">
        <h2 className="text-lg font-semibold">Pass Packages / 套餐购买</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {packages.map((pkg) => (
            <div key={pkg.id} className="rounded-xl border border-white/15 p-4">
              <p className="font-semibold">{pkg.titleZh}</p>
              <p className="text-sm text-white/60">{pkg.title}</p>
              <p className="mt-2 text-sm">Credits: {pkg.credits}</p>
              <p className="text-sm text-white/50 line-through">${pkg.originalPrice}</p>
              <p className="text-xl font-bold text-cyan-300">${pkg.price}</p>
              <button
                onClick={() => onBuyPackage(pkg.id)}
                className="mt-3 rounded-full px-4 py-2 text-xs font-semibold neon-button"
              >
                Buy / 购买
              </button>
            </div>
          ))}
        </div>
      </div>

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
                        : isFreePrice(event.price)
                        ? "Join Free / 免费报名"
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
                <span>Event #{item.eventid}</span>
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
  const isFreePrice = (price: string) => {
    const v = String(price || "").trim().toLowerCase();
    return v === "0" || v === "$0" || v === "free";
  };
