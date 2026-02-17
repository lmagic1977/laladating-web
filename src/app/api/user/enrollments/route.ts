import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { USER_AUTH_COOKIE, verifyUserSessionToken } from "@/lib/user-auth";
import { getEvents } from "@/lib/db";

type Enrollment = {
  id: string;
  attendeeId: string;
  eventId: string;
  payment: string;
  status: string;
  createdAt: string;
};

const localEnrollments: Enrollment[] = [];

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

async function fetchRemoteEnrollments(userId: string): Promise<Enrollment[]> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/registrations?attendeeId=eq.${encodeURIComponent(userId)}&select=*`,
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

  return NextResponse.json(localEnrollments.filter((e) => e.attendeeId === user.userId));
}

export async function POST(request: Request) {
  const user = getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const eventId = String(body?.eventId || "");
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

  if (hasSupabase()) {
    const existing = await fetchRemoteEnrollments(user.userId);
    const duplicate = existing.some((e) => e.eventId === eventId && e.status === "paid");
    if (duplicate) {
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
    const amount = String((event as any)?.price || "$39");

    const payload: Enrollment = {
      id: String(Date.now()),
      attendeeId: user.userId,
      eventId,
      payment: `paid:${amount}`,
      status: "paid",
      createdAt: new Date().toISOString(),
    };

    const insertRes = await fetch(`${supabaseUrl}/rest/v1/registrations`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    });
    if (!insertRes.ok) {
      return NextResponse.json({ error: await insertRes.text() }, { status: 500 });
    }
    const created = (await insertRes.json()) as Enrollment[];
    return NextResponse.json({ ok: true, enrollment: created[0], paymentMode: "test_paid" });
  }

  const duplicate = localEnrollments.some(
    (e) => e.attendeeId === user.userId && e.eventId === eventId && e.status === "paid"
  );
  if (duplicate) return NextResponse.json({ error: "Already enrolled in this event" }, { status: 409 });

  const localEvent = getEvents().find((e) => String(e.id) === eventId);
  const amount = localEvent?.price || "$39";
  const enrollment: Enrollment = {
    id: String(Date.now()),
    attendeeId: user.userId,
    eventId,
    payment: `paid:${amount}`,
    status: "paid",
    createdAt: new Date().toISOString(),
  };
  localEnrollments.push(enrollment);
  return NextResponse.json({ ok: true, enrollment, paymentMode: "test_paid" });
}
