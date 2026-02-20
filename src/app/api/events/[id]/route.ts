import { NextResponse } from "next/server";
import { getEvents, updateEventById } from "@/lib/db";

function normalizeSupabaseUrl(url?: string) {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

const supabaseUrl = normalizeSupabaseUrl(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseReadKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseWriteKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function hasSupabaseConfig() {
  return Boolean(supabaseUrl && supabaseReadKey);
}

function hasSupabaseWriteConfig() {
  return Boolean(supabaseUrl && supabaseWriteKey);
}

function randomCodePart(length: number) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function createEventCode(date: string, location: string, existingCodes: Set<string>) {
  const datePart =
    date.replace(/-/g, "").slice(0, 8) || new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const words = location
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter(Boolean);
  const prefix = (words[0]?.[0] || "H") + (words[1]?.[0] || words[0]?.[1] || "B");
  for (let i = 0; i < 20; i += 1) {
    const code = `${prefix}-${datePart}-${randomCodePart(4)}`;
    if (!existingCodes.has(code)) return code;
  }
  return `${prefix}-${datePart}-${Date.now().toString().slice(-4)}`;
}

async function patchRemoteEvent(id: string, patch: Record<string, unknown>) {
  if (!hasSupabaseConfig()) return { ok: false, error: "Missing Supabase config" };
  const withNewCols = patch;
  const withLegacyCols = {
    title: patch.name,
    date: patch.date,
    time: patch.time,
    location: patch.location,
    event_code: patch.event_code,
    price: patch.price,
    seats: patch.max_participants,
    organizer_name: patch.organizer_name,
    organizer_phone: patch.organizer_phone,
    status: patch.status,
  };
  const withLegacyColsNoOrganizer = {
    title: patch.name,
    date: patch.date,
    time: patch.time,
    location: patch.location,
    event_code: patch.event_code,
    price: patch.price,
    seats: patch.max_participants,
    status: patch.status,
  };

  const payloads = [withNewCols, withLegacyCols, withLegacyColsNoOrganizer];
  for (const body of payloads) {
    const response = await fetch(`${supabaseUrl}/rest/v1/events?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        apikey: String(supabaseWriteKey),
        Authorization: `Bearer ${String(supabaseWriteKey)}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(body),
    });
    if (response.ok) {
      const rows = (await response.json().catch(() => [])) as Array<Record<string, unknown>>;
      if (Array.isArray(rows) && rows.length > 0) return { ok: true, row: rows[0] };
      // Some PostgREST/Supabase setups return 200/204 with empty body on PATCH.
      // We still treat it as success and verify by reading the record afterward.
      return { ok: true };
    }
  }
  return { ok: false, error: "Failed to update event" };
}

async function fetchRemoteEventById(id: string) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/events?id=eq.${encodeURIComponent(id)}&select=id,status,event_code,code&limit=1`,
    {
      headers: {
        apikey: String(supabaseReadKey),
        Authorization: `Bearer ${String(supabaseReadKey)}`,
      },
      cache: "no-store",
    }
  );
  if (!response.ok) return null;
  const rows = (await response.json().catch(() => [])) as Array<Record<string, unknown>>;
  return rows[0] || null;
}

async function fetchRemoteEventByCode(eventCode: string) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/events?event_code=eq.${encodeURIComponent(eventCode)}&select=id,status,event_code,code&limit=1`,
    {
      headers: {
        apikey: String(supabaseReadKey),
        Authorization: `Bearer ${String(supabaseReadKey)}`,
      },
      cache: "no-store",
    }
  );
  if (!response.ok) return null;
  const rows = (await response.json().catch(() => [])) as Array<Record<string, unknown>>;
  return rows[0] || null;
}

async function patchRemoteEventByCode(eventCode: string, patch: Record<string, unknown>) {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/events?event_code=eq.${encodeURIComponent(eventCode)}`,
    {
      method: "PATCH",
      headers: {
        apikey: String(supabaseWriteKey),
        Authorization: `Bearer ${String(supabaseWriteKey)}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(patch),
    }
  );
  return response.ok;
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const { id } = await Promise.resolve(params);
  const body = await request.json().catch(() => ({}));

  if (body?.action === "regenerate_code") {
    const sourceDate = String(body?.date || "");
    const sourceLocation = String(body?.location || "");

    if (hasSupabaseConfig()) {
      const listResponse = await fetch(`${supabaseUrl}/rest/v1/events?select=id,date,location,event_code,code`, {
        headers: {
          apikey: String(supabaseReadKey),
          Authorization: `Bearer ${String(supabaseReadKey)}`,
        },
        cache: "no-store",
      });
      const rows = listResponse.ok ? ((await listResponse.json()) as Record<string, unknown>[]) : [];
      const existingCodes = new Set(
        rows
          .map((row) => String(row.event_code || row.code || ""))
          .filter(Boolean)
      );
      const current = rows.find((row) => String(row.id) === String(id));
      const nextCode = createEventCode(
        sourceDate || String(current?.date || ""),
        sourceLocation || String(current?.location || ""),
        existingCodes
      );
      const updated = await patchRemoteEvent(String(id), { event_code: nextCode });
      if (!updated.ok) return NextResponse.json({ error: updated.error }, { status: 500 });
      return NextResponse.json({ success: true, event_code: nextCode });
    }

    const localEvents = getEvents();
    const current = localEvents.find((item) => String(item.id) === String(id));
    if (!current) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    const existingCodes = new Set(localEvents.map((item) => String(item.event_code || "")).filter(Boolean));
    const nextCode = createEventCode(sourceDate || current.date, sourceLocation || current.location, existingCodes);
    const updated = updateEventById(Number(id), { event_code: nextCode });
    if (!updated) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    return NextResponse.json({ success: true, event_code: nextCode });
  }

  const nextStatus = body?.status === "active" ? "active" : body?.status === "closed" ? "closed" : "";
  const eventCode = String(body?.event_code || "").trim();
  if (!nextStatus) {
    return NextResponse.json({ error: "status must be active or closed" }, { status: 400 });
  }

  if (hasSupabaseConfig()) {
    if (!hasSupabaseWriteConfig()) {
      return NextResponse.json(
        { error: "缺少 SUPABASE_SERVICE_ROLE_KEY，无法修改活动状态" },
        { status: 500 }
      );
    }
    const updated = await patchRemoteEvent(String(id), { status: nextStatus });
    if (!updated.ok) return NextResponse.json({ error: "更新失败：未匹配到活动记录，请检查活动ID" }, { status: 500 });
    const current = await fetchRemoteEventById(String(id));
    if (current && String(current.status || "") === nextStatus) {
      return NextResponse.json({ success: true, status: nextStatus });
    }

    // Fallback: some environments may display a non-id value in UI; try event_code.
    if (eventCode) {
      const patchedByCode = await patchRemoteEventByCode(eventCode, { status: nextStatus });
      if (patchedByCode) {
        const byCode = await fetchRemoteEventByCode(eventCode);
        if (byCode && String(byCode.status || "") === nextStatus) {
          return NextResponse.json({ success: true, status: nextStatus });
        }
      }
    }

    {
      return NextResponse.json(
        { error: "状态未成功写入数据库，请检查 events 表的 status 字段和类型" },
        { status: 500 }
      );
    }
  }

  const eventId = Number(id);
  if (Number.isNaN(eventId)) return NextResponse.json({ error: "Invalid event id" }, { status: 400 });
  const updated = updateEventById(eventId, { status: nextStatus });
  if (!updated) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  return NextResponse.json({ success: true, status: nextStatus });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const { id } = await Promise.resolve(params);
  const body = await request.json().catch(() => ({}));

  const nextStatus: "active" | "closed" = body?.status === "closed" ? "closed" : "active";
  const patch = {
    name: String(body?.name || ""),
    date: String(body?.date || ""),
    time: String(body?.time || ""),
    location: String(body?.location || ""),
    event_code: String(body?.event_code || body?.eventCode || ""),
    price: String(body?.price || ""),
    age_range: String(body?.age_range || body?.ageRange || ""),
    max_participants: Number(body?.max_participants || body?.maxParticipants || 20),
    organizer_name: String(body?.organizer_name || body?.organizerName || ""),
    organizer_phone: String(body?.organizer_phone || body?.organizerPhone || ""),
    status: nextStatus,
  };

  if (!patch.name || !patch.date || !patch.time || !patch.location || !patch.price || !patch.age_range) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (hasSupabaseConfig()) {
    if (!hasSupabaseWriteConfig()) {
      return NextResponse.json(
        { error: "缺少 SUPABASE_SERVICE_ROLE_KEY，无法编辑活动" },
        { status: 500 }
      );
    }
    const updated = await patchRemoteEvent(String(id), patch);
    if (!updated.ok) return NextResponse.json({ error: updated.error }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  const eventId = Number(id);
  if (Number.isNaN(eventId)) return NextResponse.json({ error: "Invalid event id" }, { status: 400 });
  const localUpdated = updateEventById(eventId, patch);
  if (!localUpdated) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  return NextResponse.json(localUpdated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const { id } = await Promise.resolve(params);
  if (hasSupabaseConfig()) {
    if (!hasSupabaseWriteConfig()) {
      return NextResponse.json(
        { error: "缺少 SUPABASE_SERVICE_ROLE_KEY，无法下架活动" },
        { status: 500 }
      );
    }
    const updated = await patchRemoteEvent(String(id), { status: "closed" });
    if (!updated.ok) return NextResponse.json({ error: updated.error }, { status: 500 });
    return NextResponse.json({ success: true, status: "closed" });
  }
  const eventId = Number(id);
  if (Number.isNaN(eventId)) return NextResponse.json({ error: "Invalid event id" }, { status: 400 });
  const localUpdated = updateEventById(eventId, { status: "closed" });
  if (!localUpdated) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  return NextResponse.json({ success: true, status: "closed" });
}
