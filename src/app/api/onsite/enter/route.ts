import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { USER_AUTH_COOKIE, verifyUserSessionToken } from "@/lib/user-auth";
import { getEvents, getRegistrations } from "@/lib/db";

function normalizeSupabaseUrl(url?: string) {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

const supabaseUrl = normalizeSupabaseUrl(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function hasSupabase() {
  return Boolean(supabaseUrl && serviceKey);
}

function getUser() {
  const token = cookies().get(USER_AUTH_COOKIE)?.value;
  return verifyUserSessionToken(token);
}

export async function POST(request: Request) {
  const user = getUser();
  if (!user) {
    return NextResponse.json({ error: "Please login first / 请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const code = String(body?.code || "").trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ error: "Event code is required / 请输入活动代码" }, { status: 400 });
  }

  if (hasSupabase()) {
    const eventRes = await fetch(`${supabaseUrl}/rest/v1/events?select=*`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      cache: "no-store",
    });

    const events = eventRes.ok ? ((await eventRes.json()) as Array<Record<string, unknown>>) : [];
    const event = events.find((item) => {
      const eventCode = String(item.event_code || item.code || "").toUpperCase();
      return eventCode === code;
    });
    if (!event) {
      return NextResponse.json({ error: "Invalid event code / 活动代码无效" }, { status: 404 });
    }

    const eventId = String(event.id || "");
    const [enrollByIdRes, enrollByEmailRes] = await Promise.all([
      fetch(
        `${supabaseUrl}/rest/v1/registrations?eventid=eq.${encodeURIComponent(eventId)}&attendeeid=eq.${encodeURIComponent(user.userId)}&select=*`,
        {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
          cache: "no-store",
        }
      ),
      fetch(
        `${supabaseUrl}/rest/v1/registrations?eventid=eq.${encodeURIComponent(eventId)}&attendeeid=eq.${encodeURIComponent(user.email.toLowerCase())}&select=*`,
        {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
          cache: "no-store",
        }
      ),
    ]);

    const enrollmentsById = enrollByIdRes.ok ? ((await enrollByIdRes.json()) as Array<Record<string, unknown>>) : [];
    const enrollmentsByEmail = enrollByEmailRes.ok ? ((await enrollByEmailRes.json()) as Array<Record<string, unknown>>) : [];
    const enrollment = [...enrollmentsById, ...enrollmentsByEmail].find((row) => {
      const status = String(row.status || "");
      return status === "paid" || status === "registered";
    });

    if (!enrollment) {
      return NextResponse.json({ error: "You are not enrolled in this event / 您未报名该活动" }, { status: 403 });
    }

    return NextResponse.json({
      ok: true,
      event: {
        id: String(event.id || ""),
        name: String(event.name || event.title || ""),
        date: String(event.date || ""),
        time: String(event.time || ""),
        location: String(event.location || ""),
        event_code: String(event.event_code || event.code || code),
      },
    });
  }

  const localEvent = getEvents().find((item) => String((item as { event_code?: string }).event_code || "").toUpperCase() === code);
  if (!localEvent) {
    return NextResponse.json({ error: "Invalid event code / 活动代码无效" }, { status: 404 });
  }

  const registrations = getRegistrations();
  const enrolled = registrations.some((row) => {
    const sameEvent = String(row.event_id) === String(localEvent.id);
    const sameUser = String(row.email || "").toLowerCase() === user.email.toLowerCase();
    return sameEvent && sameUser;
  });

  if (!enrolled) {
    return NextResponse.json({ error: "You are not enrolled in this event / 您未报名该活动" }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    event: {
      id: String(localEvent.id),
      name: localEvent.name,
      date: localEvent.date,
      time: localEvent.time,
      location: localEvent.location,
      event_code: localEvent.event_code,
    },
  });
}
