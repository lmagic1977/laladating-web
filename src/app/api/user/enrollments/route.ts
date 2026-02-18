import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { USER_AUTH_COOKIE, verifyUserSessionToken } from "@/lib/user-auth";
import { getEvents } from "@/lib/db";
import { chargeForEvent, refundForEvent } from "@/lib/user-finance";
import { getLocalProfile } from "@/lib/user-profile";

type Enrollment = {
  id: string;
  attendeeid: string;
  eventid: string;
  payment: string;
  status: string;
  createdat: string;
  name?: string;
  email?: string;
  age?: number;
  headshot_url?: string;
  fullshot_url?: string;
};

const localEnrollments: Enrollment[] = [];

function parsePriceToNumber(price: string) {
  const cleaned = String(price || "").replace(/[^0-9.]/g, "");
  const amount = Number(cleaned || 0);
  return Number.isFinite(amount) ? amount : 0;
}

function normalizeSupabaseUrl(url?: string) {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

const supabaseUrl = normalizeSupabaseUrl(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function hasSupabase() {
  return Boolean(supabaseUrl && serviceKey);
}

function getUser() {
  const token = cookies().get(USER_AUTH_COOKIE)?.value;
  return verifyUserSessionToken(token);
}

function getEventStartTime(event: Record<string, unknown> | undefined) {
  if (!event) return null;
  const date = String(event.date || "");
  const time = String(event.time || "00:00");
  const dt = new Date(`${date}T${time}`);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

async function fetchUserProfile(userId: string): Promise<Record<string, unknown> | null> {
  if (hasSupabase()) {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${encodeURIComponent(userId)}&select=*`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
        cache: "no-store",
      }
    );
    if (res.ok) {
      const rows = (await res.json()) as Record<string, unknown>[];
      return rows[0] || null;
    }
  }
  return (getLocalProfile(userId) as Record<string, unknown> | null) || null;
}

function validateRequiredProfile(profile: Record<string, unknown> | null) {
  if (!profile) return false;
  const requiredFields = [
    "age",
    "job",
    "interests",
    "zodiac",
    "height_cm",
    "body_type",
    "headshot_url",
    "fullshot_url",
  ];
  return requiredFields.every((key) => {
    const val = profile[key];
    if (val === null || val === undefined) return false;
    if (typeof val === "number") return val > 0;
    return String(val).trim().length > 0;
  });
}

async function fetchRemoteEnrollments(userId: string): Promise<Enrollment[]> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/registrations?attendeeid=eq.${encodeURIComponent(userId)}&select=*`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      cache: "no-store",
    }
  );
  if (!res.ok) return [];
  return (await res.json()) as Enrollment[];
}

export async function GET() {
  const user = getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (hasSupabase()) {
    const rows = await fetchRemoteEnrollments(user.userId);
    return NextResponse.json(rows);
  }

  return NextResponse.json(localEnrollments.filter((e) => e.attendeeid === user.userId));
}

export async function POST(request: Request) {
  const user = getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const eventId = String(body?.eventId || "");
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

  const profile = await fetchUserProfile(user.userId);
  if (!validateRequiredProfile(profile)) {
    return NextResponse.json(
      { error: "请先完善资料并上传头像+全身照后再报名 / Complete all profile fields and upload photos first" },
      { status: 400 }
    );
  }

  if (hasSupabase()) {
    const existing = await fetchRemoteEnrollments(user.userId);
    const sameEvent = existing.find((e) => e.eventid === eventId);
    if (sameEvent && (sameEvent.status === "paid" || sameEvent.status === "registered")) {
      return NextResponse.json({ error: "Already enrolled in this event" }, { status: 409 });
    }

    const eventRes = await fetch(`${supabaseUrl}/rest/v1/events?id=eq.${encodeURIComponent(eventId)}&select=*`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      cache: "no-store",
    });
    const eventRows = eventRes.ok ? ((await eventRes.json()) as Record<string, unknown>[]) : [];
    const event = eventRows[0] || getEvents().find((e) => String(e.id) === eventId);
    const amountText = String((event as any)?.price || "$39");
    const amountNumber = parsePriceToNumber(amountText);
    let charge: ReturnType<typeof chargeForEvent>;
    try {
      charge = chargeForEvent(user.userId, amountNumber);
    } catch (error) {
      if (error instanceof Error && error.message === "INSUFFICIENT_BALANCE") {
        return NextResponse.json({ error: "Insufficient wallet balance / 余额不足" }, { status: 400 });
      }
      throw error;
    }
    const payment =
      charge.method === "free"
        ? "free:0"
        : charge.method === "pass"
        ? `pass:${charge.packageId}`
        : `wallet:$${amountNumber}`;

    const payload: Enrollment = {
      id: sameEvent?.id || String(Date.now()),
      attendeeid: user.userId,
      eventid: eventId,
      payment,
      status: "paid",
      createdat: new Date().toISOString(),
      name: String((profile?.name as string) || user.email.split("@")[0] || "User"),
      email: user.email,
      age: Number(profile?.age || 0),
      headshot_url: String(profile?.headshot_url || ""),
      fullshot_url: String(profile?.fullshot_url || ""),
    };

    const url = sameEvent
      ? `${supabaseUrl}/rest/v1/registrations?id=eq.${encodeURIComponent(sameEvent.id)}`
      : `${supabaseUrl}/rest/v1/registrations`;
    const method = sameEvent ? "PATCH" : "POST";
    const saveRes = await fetch(url, {
      method,
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    });
    if (!saveRes.ok) {
      return NextResponse.json({ error: await saveRes.text() }, { status: 500 });
    }
    const saved = (await saveRes.json()) as Enrollment[];
    return NextResponse.json({ ok: true, enrollment: saved[0] || payload, paymentMode: payment });
  }

  const sameEventLocal = localEnrollments.find(
    (e) => e.attendeeid === user.userId && e.eventid === eventId
  );
  if (sameEventLocal && (sameEventLocal.status === "paid" || sameEventLocal.status === "registered")) {
    return NextResponse.json({ error: "Already enrolled in this event" }, { status: 409 });
  }

  const localEvent = getEvents().find((e) => String(e.id) === eventId);
  const amountText = localEvent?.price || "$39";
  const amountNumber = parsePriceToNumber(amountText);
  let charge: ReturnType<typeof chargeForEvent>;
  try {
    charge = chargeForEvent(user.userId, amountNumber);
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_BALANCE") {
      return NextResponse.json({ error: "Insufficient wallet balance / 余额不足" }, { status: 400 });
    }
    throw error;
  }
  const payment =
    charge.method === "free"
      ? "free:0"
      : charge.method === "pass"
      ? `pass:${charge.packageId}`
      : `wallet:$${amountNumber}`;
  const enrollment: Enrollment = {
    id: sameEventLocal?.id || String(Date.now()),
    attendeeid: user.userId,
    eventid: eventId,
    payment,
    status: "paid",
    createdat: new Date().toISOString(),
    name: String((profile?.name as string) || user.email.split("@")[0] || "User"),
    email: user.email,
    age: Number(profile?.age || 0),
    headshot_url: String(profile?.headshot_url || ""),
    fullshot_url: String(profile?.fullshot_url || ""),
  };
  if (sameEventLocal) {
    Object.assign(sameEventLocal, enrollment);
  } else {
    localEnrollments.push(enrollment);
  }
  return NextResponse.json({ ok: true, enrollment, paymentMode: payment });
}

export async function DELETE(request: Request) {
  const user = getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const eventId = String(searchParams.get("eventId") || "");
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

  if (hasSupabase()) {
    const existing = await fetchRemoteEnrollments(user.userId);
    const target = existing.find((e) => e.eventid === eventId && e.status === "paid");
    if (!target) return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });

    const eventRes = await fetch(`${supabaseUrl}/rest/v1/events?id=eq.${encodeURIComponent(eventId)}&select=*`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      cache: "no-store",
    });
    const eventRows = eventRes.ok ? ((await eventRes.json()) as Record<string, unknown>[]) : [];
    const event = eventRows[0] || (getEvents().find((e) => String(e.id) === eventId) as unknown as Record<string, unknown>);
    const start = getEventStartTime(event);
    if (start) {
      const diffMs = start.getTime() - Date.now();
      const cutoffMs = 24 * 60 * 60 * 1000;
      if (diffMs < cutoffMs) {
        return NextResponse.json({ error: "Cancellation is only allowed 24h before event / 活动开始前24小时可取消" }, { status: 400 });
      }
    }

    refundForEvent(user.userId, target.payment);
    const patchRes = await fetch(
      `${supabaseUrl}/rest/v1/registrations?id=eq.${encodeURIComponent(target.id)}`,
      {
        method: "PATCH",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({ status: "cancelled_by_user" }),
      }
    );
    if (!patchRes.ok) return NextResponse.json({ error: await patchRes.text() }, { status: 500 });
    return NextResponse.json({ ok: true, refunded: true });
  }

  const idx = localEnrollments.findIndex(
    (e) => e.attendeeid === user.userId && e.eventid === eventId && e.status === "paid"
  );
  if (idx < 0) return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });

  const localEvent = getEvents().find((e) => String(e.id) === eventId);
  const start = localEvent ? new Date(`${localEvent.date}T${localEvent.time}`) : null;
  if (start && !Number.isNaN(start.getTime())) {
    const diffMs = start.getTime() - Date.now();
    const cutoffMs = 24 * 60 * 60 * 1000;
    if (diffMs < cutoffMs) {
      return NextResponse.json({ error: "Cancellation is only allowed 24h before event / 活动开始前24小时可取消" }, { status: 400 });
    }
  }

  refundForEvent(user.userId, localEnrollments[idx].payment);
  localEnrollments[idx].status = "cancelled_by_user";
  return NextResponse.json({ ok: true, refunded: true });
}
