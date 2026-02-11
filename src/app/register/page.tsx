"use client";

import { useEffect, useState } from "react";
import type { EventItem } from "@/lib/db";

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export default function RegisterPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then(setEvents)
      .catch(() => setEvents([]));
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const headshot = data.get("photo_head") as File;
    const fullshot = data.get("photo_full") as File;

    if (!headshot || !fullshot) {
      alert("请上传大头照和全身照");
      return;
    }

    setLoading(true);
    try {
      const [headUrl, fullUrl] = await Promise.all([
        readFileAsDataUrl(headshot).then((dataUrl) =>
          fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: `head-${Date.now()}-${headshot.name}`,
              dataUrl,
            }),
          }).then((res) => res.json())
        ),
        readFileAsDataUrl(fullshot).then((dataUrl) =>
          fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: `full-${Date.now()}-${fullshot.name}`,
              dataUrl,
            }),
          }).then((res) => res.json())
        ),
      ]);

      const attendeeId = `att-${Date.now()}`;
      await fetch("/api/attendees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: attendeeId,
          name: data.get("name"),
          age: Number(data.get("age")),
          job: data.get("job"),
          contact: data.get("contact"),
          interests: data.get("interests"),
          intro: data.get("intro"),
          status: "pending",
          eventId: data.get("eventId"),
          headshotUrl: headUrl.url,
          fullshotUrl: fullUrl.url,
        }),
      });

      await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: `reg-${Date.now()}`,
          attendeeId,
          eventId: data.get("eventId"),
          payment: data.get("payment"),
          status: "submitted",
          createdAt: new Date().toISOString(),
        }),
      });

      form.reset();
      alert("报名成功，等待人工审核");
    } catch (err) {
      alert("提交失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
      <div className="neon-card p-6">
        <h1 className="text-2xl font-semibold">报名与资料</h1>
        <p className="mt-2 text-sm text-white/60">资料提交后进入人工审核。</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-white/70">姓名 / 昵称</label>
              <input name="name" required className="mt-2 w-full rounded-xl px-3 py-2 neon-input" />
            </div>
            <div>
              <label className="text-sm text-white/70">年龄</label>
              <input name="age" type="number" required className="mt-2 w-full rounded-xl px-3 py-2 neon-input" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-white/70">职业</label>
              <input name="job" required className="mt-2 w-full rounded-xl px-3 py-2 neon-input" />
            </div>
            <div>
              <label className="text-sm text-white/70">联系方式</label>
              <input name="contact" required className="mt-2 w-full rounded-xl px-3 py-2 neon-input" />
            </div>
          </div>
          <div>
            <label className="text-sm text-white/70">兴趣标签</label>
            <input name="interests" required className="mt-2 w-full rounded-xl px-3 py-2 neon-input" />
          </div>
          <div>
            <label className="text-sm text-white/70">自我介绍</label>
            <textarea name="intro" className="mt-2 w-full rounded-xl px-3 py-2 neon-input" rows={4} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-white/70">大头照</label>
              <input name="photo_head" type="file" accept="image/*" required className="mt-2 w-full" />
            </div>
            <div>
              <label className="text-sm text-white/70">全身照</label>
              <input name="photo_full" type="file" accept="image/*" required className="mt-2 w-full" />
            </div>
          </div>
          <div>
            <label className="text-sm text-white/70">选择活动</label>
            <select name="eventId" className="mt-2 w-full rounded-xl px-3 py-2 neon-input">
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title} · {event.date}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-white/70">支付方式</label>
            <select name="payment" className="mt-2 w-full rounded-xl px-3 py-2 neon-input">
              <option>Stripe / Card</option>
              <option>PayPal</option>
              <option>Onsite / Transfer</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-full px-4 py-2 text-sm font-semibold neon-button disabled:opacity-60"
          >
            {loading ? "提交中..." : "提交并等待审核"}
          </button>
        </form>
      </div>
      <div className="neon-card p-6">
        <h3 className="text-lg font-semibold">报名说明</h3>
        <ul className="mt-4 space-y-2 text-sm text-white/70">
          <li>提交资料后 24 小时内完成人工审核。</li>
          <li>必须上传大头照 + 全身照各 1 张。</li>
          <li>审核通过后发送报名确认。</li>
          <li>现场签到后进入互动模式。</li>
        </ul>
      </div>
    </div>
  );
}
