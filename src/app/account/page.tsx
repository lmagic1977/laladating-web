"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

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

type ProfileForm = {
  age: string;
  job: string;
  interests: string;
  zodiac: string;
  height_cm: string;
  body_type: string;
  headshot_url: string;
  fullshot_url: string;
  photos: string[];
};

export default function AccountPage() {
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [error, setError] = useState("");
  const [payingId, setPayingId] = useState<string>("");
  const [cancelingId, setCancelingId] = useState<string>("");
  const [wallet, setWallet] = useState<WalletState>({ balance: 0, passes: [], ledger: [] });
  const [packages, setPackages] = useState<PassPackage[]>([]);
  const [profile, setProfile] = useState<ProfileForm>({
    age: "",
    job: "",
    interests: "",
    zodiac: "",
    height_cm: "",
    body_type: "",
    headshot_url: "",
    fullshot_url: "",
    photos: [],
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const isFreePrice = (price: string) => {
    const v = String(price || "").trim().toLowerCase();
    return v === "0" || v === "$0" || v === "free";
  };

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

    const [eventsRes, enrollmentsRes, walletRes, packageRes, profileRes] = await Promise.all([
      fetch("/api/events", { cache: "no-store" }),
      fetch("/api/user/enrollments", { cache: "no-store" }),
      fetch("/api/user/wallet", { cache: "no-store" }),
      fetch("/api/user/packages", { cache: "no-store" }),
      fetch("/api/user/profile", { cache: "no-store" }),
    ]);
    setEvents(await eventsRes.json());
    setEnrollments(await enrollmentsRes.json());
    setWallet(await walletRes.json());
    setPackages(await packageRes.json());
    const profileData = await profileRes.json();
    setProfile({
      age: profileData?.age ? String(profileData.age) : "",
      job: profileData?.job || "",
      interests: profileData?.interests || "",
      zodiac: profileData?.zodiac || "",
      height_cm: profileData?.height_cm ? String(profileData.height_cm) : "",
      body_type: profileData?.body_type || "",
      headshot_url: profileData?.headshot_url || "",
      fullshot_url: profileData?.fullshot_url || "",
      photos: Array.isArray(profileData?.photos) ? profileData.photos : [],
    });
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

  const onCancelEnrollment = async (eventId: string | number) => {
    const ok = window.confirm('确认取消报名并退回额度吗？');
    if (!ok) return;
    setError("");
    setCancelingId(String(eventId));
    try {
      const res = await fetch(`/api/user/enrollments?eventId=${encodeURIComponent(String(eventId))}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Cancel failed");
        return;
      }
      await load();
      alert("报名已取消，额度已退回 / Enrollment cancelled and credit refunded");
    } finally {
      setCancelingId("");
    }
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

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const onUploadSingle = (field: "headshot_url" | "fullshot_url") =>
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const dataUrl = await fileToDataUrl(file);
      setProfile((prev) => ({ ...prev, [field]: dataUrl }));
    };

  const onUploadMulti = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const list = await Promise.all(Array.from(files).map(fileToDataUrl));
    setProfile((prev) => ({ ...prev, photos: [...prev.photos, ...list].slice(0, 6) }));
  };

  const onSaveProfile = async () => {
    setError("");
    setSavingProfile(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Save profile failed");
        return;
      }
      alert("个人资料已保存 / Profile saved");
    } finally {
      setSavingProfile(false);
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

      <div className="neon-card p-5">
        <h2 className="text-lg font-semibold">Event Registration / 活动报名</h2>
        <p className="mt-2 text-sm text-white/70">
          请先填写报名资料（含头像和全身照），再在下方活动列表完成支付报名。
        </p>
        <a href="/register" className="mt-4 inline-block rounded-full px-4 py-2 text-xs font-semibold neon-button">
          填写报名资料 / Complete Registration Profile
        </a>
      </div>

      <div className="neon-card p-5">
        <h2 className="text-lg font-semibold">Profile / 个人信息</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <input value={profile.age} onChange={(e) => setProfile({ ...profile, age: e.target.value })} placeholder="年龄 Age" className="rounded-lg border border-white/20 bg-white/10 px-3 py-2" />
          <input value={profile.job} onChange={(e) => setProfile({ ...profile, job: e.target.value })} placeholder="工作 Job" className="rounded-lg border border-white/20 bg-white/10 px-3 py-2" />
          <input value={profile.interests} onChange={(e) => setProfile({ ...profile, interests: e.target.value })} placeholder="兴趣爱好 Interests" className="rounded-lg border border-white/20 bg-white/10 px-3 py-2" />
          <input value={profile.zodiac} onChange={(e) => setProfile({ ...profile, zodiac: e.target.value })} placeholder="星座 Zodiac" className="rounded-lg border border-white/20 bg-white/10 px-3 py-2" />
          <input value={profile.height_cm} onChange={(e) => setProfile({ ...profile, height_cm: e.target.value })} placeholder="身高(cm) Height" className="rounded-lg border border-white/20 bg-white/10 px-3 py-2" />
          <input value={profile.body_type} onChange={(e) => setProfile({ ...profile, body_type: e.target.value })} placeholder="身材类型 Body Type" className="rounded-lg border border-white/20 bg-white/10 px-3 py-2" />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <p className="mb-2 text-sm text-white/70">头像照片</p>
            <input type="file" accept="image/*" onChange={onUploadSingle("headshot_url")} className="text-sm" />
            {profile.headshot_url ? <img src={profile.headshot_url} alt="headshot" className="mt-2 h-16 w-16 rounded-full object-cover" /> : null}
          </div>
          <div>
            <p className="mb-2 text-sm text-white/70">全身照片</p>
            <input type="file" accept="image/*" onChange={onUploadSingle("fullshot_url")} className="text-sm" />
            {profile.fullshot_url ? <img src={profile.fullshot_url} alt="fullshot" className="mt-2 h-20 w-16 rounded object-cover" /> : null}
          </div>
          <div>
            <p className="mb-2 text-sm text-white/70">更多照片（最多6张）</p>
            <input type="file" accept="image/*" multiple onChange={onUploadMulti} className="text-sm" />
            <div className="mt-2 flex flex-wrap gap-2">
              {profile.photos.map((p, idx) => (
                <img key={idx} src={p} alt={`photo-${idx}`} className="h-14 w-14 rounded object-cover" />
              ))}
            </div>
          </div>
        </div>
        <button
          onClick={onSaveProfile}
          disabled={savingProfile}
          className="mt-4 rounded-full px-4 py-2 text-xs font-semibold neon-button disabled:opacity-60"
        >
          {savingProfile ? "Saving..." : "保存资料 / Save Profile"}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="neon-card p-5">
          <h2 className="text-lg font-semibold">Wallet / 钱包</h2>
          <p className="mt-2 text-3xl font-bold text-cyan-300">${wallet.balance.toFixed(2)}</p>
          <p className="mt-4 text-sm text-white/70">充值由管理员操作 / Top-up is managed by admin only</p>
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
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-300">
                        Joined / 已报名
                      </span>
                      <a
                        href={`/events/${event.id}`}
                        className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/80 hover:bg-white/10"
                      >
                        报名详情
                      </a>
                      <button
                        onClick={() => onCancelEnrollment(event.id)}
                        disabled={cancelingId === String(event.id)}
                        className="rounded-full border border-red-400/40 px-3 py-1 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-60"
                      >
                        {cancelingId === String(event.id) ? "Cancelling..." : "取消报名"}
                      </button>
                    </div>
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
