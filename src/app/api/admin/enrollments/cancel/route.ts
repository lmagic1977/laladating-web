import { NextRequest, NextResponse } from "next/server";
import { ADMIN_AUTH_COOKIE, getAdminSessionValue } from "@/lib/admin-auth";
import { refundForEvent } from "@/lib/user-finance";

function normalizeSupabaseUrl(url?: string) {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

const supabaseUrl = normalizeSupabaseUrl(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

function hasSupabase() {
  return Boolean(supabaseUrl && serviceKey);
}

export async function POST(request: NextRequest) {
  const isAdmin = request.cookies.get(ADMIN_AUTH_COOKIE)?.value === getAdminSessionValue();
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasSupabase()) return NextResponse.json({ error: "Supabase required" }, { status: 400 });

  const body = await request.json();
  const registrationId = String(body?.registrationId || "");
  if (!registrationId) return NextResponse.json({ error: "registrationId required" }, { status: 400 });

  const fetchRes = await fetch(
    `${supabaseUrl}/rest/v1/registrations?id=eq.${encodeURIComponent(registrationId)}&select=*`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      cache: "no-store",
    }
  );
  const rows = fetchRes.ok ? ((await fetchRes.json()) as Record<string, unknown>[]) : [];
  const row = rows[0];
  if (!row) return NextResponse.json({ error: "Registration not found" }, { status: 404 });

  const attendeeId = String(row.attendeeid || row.attendeeId || "");
  const payment = String(row.payment || "");

  const eventId = String(row.eventid || row.eventId || "");
  if (eventId) {
    const eventRes = await fetch(
      `${supabaseUrl}/rest/v1/events?id=eq.${encodeURIComponent(eventId)}&select=*`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
        cache: "no-store",
      }
    );
    const eventRows = eventRes.ok ? ((await eventRes.json()) as Record<string, unknown>[]) : [];
    const event = eventRows[0];
    if (event) {
      const date = String(event.date || "");
      const time = String(event.time || "00:00");
      const eventStart = new Date(`${date}T${time}`);
      if (!Number.isNaN(eventStart.getTime())) {
        const diffMs = eventStart.getTime() - Date.now();
        const cutoffMs = 24 * 60 * 60 * 1000;
        if (diffMs < cutoffMs) {
          return NextResponse.json(
            { error: "Only allowed before 24h of event start / 仅活动开始前24小时可取消资格" },
            { status: 400 }
          );
        }
      }
    }
  }

  if (attendeeId) refundForEvent(attendeeId, payment);

  const patchRes = await fetch(
    `${supabaseUrl}/rest/v1/registrations?id=eq.${encodeURIComponent(registrationId)}`,
    {
      method: "PATCH",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ status: "cancelled_by_admin" }),
    }
  );
  if (!patchRes.ok) return NextResponse.json({ error: await patchRes.text() }, { status: 500 });
  return NextResponse.json({ ok: true, refunded: true });
}
