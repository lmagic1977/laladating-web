import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { USER_AUTH_COOKIE, verifyUserSessionToken } from "@/lib/user-auth";
import { getEvents } from "@/lib/db";
import { chargeForEvent } from "@/lib/user-finance";

type Enrollment = {
  id: string;
  attendeeid: string;
  eventid: string;
  payment: string;
  status: string;
  createdat: string;
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

  if (hasSupabase()) {
    const existing = await fetchRemoteEnrollments(user.userId);
    const duplicate = existing.some((e) => e.eventid === eventId && e.status === "paid");
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
      id: String(Date.now()),
      attendeeid: user.userId,
      eventid: eventId,
      payment,
      status: "paid",
      createdat: new Date().toISOString(),
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
    return NextResponse.json({ ok: true, enrollment: created[0], paymentMode: payment });
  }

  const duplicate = localEnrollments.some(
    (e) => e.attendeeid === user.userId && e.eventid === eventId && e.status === "paid"
  );
  if (duplicate) return NextResponse.json({ error: "Already enrolled in this event" }, { status: 409 });

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
    id: String(Date.now()),
    attendeeid: user.userId,
    eventid: eventId,
    payment,
    status: "paid",
    createdat: new Date().toISOString(),
  };
  localEnrollments.push(enrollment);
  return NextResponse.json({ ok: true, enrollment, paymentMode: payment });
}
