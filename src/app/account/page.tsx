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

type RequiredProfileField =
  | "age"
  | "job"
  | "interests"
  | "zodiac"
  | "height_cm"
  | "body_type"
  | "headshot_url"
  | "fullshot_url";

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
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileFieldErrors, setProfileFieldErrors] = useState<Partial<Record<RequiredProfileField, string>>>({});

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
    setProfileError("");
    setProfileSuccess("");

    const fieldLabels: Record<string, string> = {
      age: "年龄 Age",
      job: "工作 Job",
      interests: "兴趣爱好 Interests",
      zodiac: "星座 Zodiac",
      height_cm: "身高 Height",
      body_type: "身材类型 Body Type",
      headshot_url: "头像照片 Headshot",
      fullshot_url: "全身照片 Full Body Photo",
    };

    const missing = Object.entries(fieldLabels)
      .filter(([key]) => !String((profile as unknown as Record<string, unknown>)[key] ?? "").trim())
      .map(([, label]) => label);
    const nextFieldErrors: Partial<Record<RequiredProfileField, string>> = {};
    (Object.keys(fieldLabels) as RequiredProfileField[]).forEach((key) => {
      if (!String((profile as unknown as Record<string, unknown>)[key] ?? "").trim()) {
        nextFieldErrors[key] = `${fieldLabels[key]} 必填`;
      }
    });
    setProfileFieldErrors(nextFieldErrors);

    if (missing.length) {
      setProfileError(`请先填写完整资料: ${missing.join("、")} / Missing required fields: ${missing.join(", ")}`);
      return;
    }

    setSavingProfile(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json().catch(() => ({} as Record<string, unknown>));
      if (!res.ok) {
        const raw = typeof data?.error === "string" ? data.error : "Save profile failed";
        if (raw.includes("Missing required profile fields:")) {
          const keys = raw
            .replace("Missing required profile fields:", "")
            .split(",")
            .map((s: string) => s.trim());
          const labels = keys.map((k: string) => fieldLabels[k] || k);
          const apiFieldErrors: Partial<Record<RequiredProfileField, string>> = {};
          keys.forEach((k: string) => {
            const key = k as RequiredProfileField;
            if (fieldLabels[key]) apiFieldErrors[key] = `${fieldLabels[key]} 必填`;
          });
          setProfileFieldErrors(apiFieldErrors);
          setProfileError(`资料不完整，请补充: ${labels.join("、")} / Please complete: ${labels.join(", ")}`);
        } else {
          setProfileError(`${raw}。请稍后重试，或联系管理员。 / Please try again or contact admin.`);
        }
        return;
      }
      setProfileFieldErrors({});
      setProfileSuccess("个人资料已保存 / Profile saved");
    } finally {
      setSavingProfile(false);
    }
  };

  const getInputClass = (field: RequiredProfileField) =>
    `rounded-lg border bg-white/10 px-3 py-2 ${
      profileFieldErrors[field]
        ? "border-red-400/70 ring-1 ring-red-400/50"
        : "border-white/20"
    }`;

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
        <h2 className="text-lg font-semibold">Profile / 个人信息</h2>
        {profileError ? (
          <div className="mt-3 rounded-lg border border-red-500/40 bg-red-500/15 px-3 py-2 text-sm text-red-200">
            {profileError}
          </div>
        ) : null}
        {profileSuccess ? (
          <div className="mt-3 rounded-lg border border-green-500/40 bg-green-500/15 px-3 py-2 text-sm text-green-200">
            {profileSuccess}
          </div>
        ) : null}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <input
              value={profile.age}
              onChange={(e) => {
                setProfile({ ...profile, age: e.target.value });
                setProfileFieldErrors((prev) => ({ ...prev, age: undefined }));
              }}
              placeholder="年龄 Age"
              className={getInputClass("age")}
            />
            {profileFieldErrors.age ? <p className="mt-1 text-xs text-red-300">{profileFieldErrors.age}</p> : null}
          </div>
          <div>
            <input
              value={profile.job}
              onChange={(e) => {
                setProfile({ ...profile, job: e.target.value });
                setProfileFieldErrors((prev) => ({ ...prev, job: undefined }));
              }}
              placeholder="工作 Job"
              className={getInputClass("job")}
            />
            {profileFieldErrors.job ? <p className="mt-1 text-xs text-red-300">{profileFieldErrors.job}</p> : null}
          </div>
          <div>
            <input
              value={profile.interests}
              onChange={(e) => {
                setProfile({ ...profile, interests: e.target.value });
                setProfileFieldErrors((prev) => ({ ...prev, interests: undefined }));
              }}
              placeholder="兴趣爱好 Interests"
              className={getInputClass("interests")}
            />
            {profileFieldErrors.interests ? <p className="mt-1 text-xs text-red-300">{profileFieldErrors.interests}</p> : null}
          </div>
          <div>
            <input
              value={profile.zodiac}
              onChange={(e) => {
                setProfile({ ...profile, zodiac: e.target.value });
                setProfileFieldErrors((prev) => ({ ...prev, zodiac: undefined }));
              }}
              placeholder="星座 Zodiac"
              className={getInputClass("zodiac")}
            />
            {profileFieldErrors.zodiac ? <p className="mt-1 text-xs text-red-300">{profileFieldErrors.zodiac}</p> : null}
          </div>
          <div>
            <input
              value={profile.height_cm}
              onChange={(e) => {
                setProfile({ ...profile, height_cm: e.target.value });
                setProfileFieldErrors((prev) => ({ ...prev, height_cm: undefined }));
              }}
              placeholder="身高(cm) Height"
              className={getInputClass("height_cm")}
            />
            {profileFieldErrors.height_cm ? <p className="mt-1 text-xs text-red-300">{profileFieldErrors.height_cm}</p> : null}
          </div>
          <div>
            <input
              value={profile.body_type}
              onChange={(e) => {
                setProfile({ ...profile, body_type: e.target.value });
                setProfileFieldErrors((prev) => ({ ...prev, body_type: undefined }));
              }}
              placeholder="身材类型 Body Type"
              className={getInputClass("body_type")}
            />
            {profileFieldErrors.body_type ? <p className="mt-1 text-xs text-red-300">{profileFieldErrors.body_type}</p> : null}
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <p className="mb-2 text-sm text-white/70">头像照片</p>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                await onUploadSingle("headshot_url")(e);
                setProfileFieldErrors((prev) => ({ ...prev, headshot_url: undefined }));
              }}
              className={`text-sm ${profileFieldErrors.headshot_url ? "text-red-300" : ""}`}
            />
            {profileFieldErrors.headshot_url ? <p className="mt-1 text-xs text-red-300">{profileFieldErrors.headshot_url}</p> : null}
            {profile.headshot_url ? <img src={profile.headshot_url} alt="headshot" className="mt-2 h-16 w-16 rounded-full object-cover" /> : null}
          </div>
          <div>
            <p className="mb-2 text-sm text-white/70">全身照片</p>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                await onUploadSingle("fullshot_url")(e);
                setProfileFieldErrors((prev) => ({ ...prev, fullshot_url: undefined }));
              }}
              className={`text-sm ${profileFieldErrors.fullshot_url ? "text-red-300" : ""}`}
            />
            {profileFieldErrors.fullshot_url ? <p className="mt-1 text-xs text-red-300">{profileFieldErrors.fullshot_url}</p> : null}
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

      <div>
        <h2 className="mb-4 text-lg font-semibold">Select Event & Join / 选择场次并报名</h2>
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
