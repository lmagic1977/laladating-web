import { NextResponse } from 'next/server';
import { getEvents, isDuplicateEvent, saveEvent } from '@/lib/db';

function normalizeSupabaseUrl(url?: string) {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://${trimmed}`;
}

const supabaseUrl = normalizeSupabaseUrl(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
);
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function hasSupabaseConfig() {
  return Boolean(supabaseUrl && supabaseKey);
}

function mapRowToEvent(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: String(row.name || row.title || ''),
    date: String(row.date || ''),
    time: String(row.time || ''),
    location: String(row.location || ''),
    price: String(row.price || ''),
    age_range: String(row.age_range || ''),
    max_participants: Number(row.max_participants || row.seats || 20),
    organizer_name: String(row.organizer_name || ''),
    organizer_phone: String(row.organizer_phone || ''),
    status: row.status === 'closed' ? 'closed' : 'active',
  };
}

export async function GET() {
  try {
    if (hasSupabaseConfig()) {
      const response = await fetch(`${supabaseUrl}/rest/v1/events?select=*`, {
        headers: {
          apikey: String(supabaseKey),
          Authorization: `Bearer ${String(supabaseKey)}`,
        },
        cache: 'no-store',
      });

      if (response.ok) {
        const rows = (await response.json()) as Record<string, unknown>[];
        return NextResponse.json(rows.map(mapRowToEvent));
      }
    }

    const events = getEvents();
    return NextResponse.json(events);
  } catch (error) {
    return NextResponse.json(
      { error: `GET /api/events failed: ${String(error)}` },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const payload = {
      name: String(data.name || ''),
      date: String(data.date || ''),
      time: String(data.time || ''),
      location: String(data.location || ''),
      price: String(data.price || ''),
      age_range: String(data.age_range || data.ageRange || ''),
      max_participants: Number(data.max_participants || data.maxParticipants || 20),
      organizer_name: String(data.organizer_name || data.organizerName || ''),
      organizer_phone: String(data.organizer_phone || data.organizerPhone || ''),
      status: data.status === 'closed' ? 'closed' : 'active',
    } as const;

    if (!payload.name || !payload.date || !payload.time || !payload.location || !payload.price || !payload.age_range) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (hasSupabaseConfig()) {
      const listResponse = await fetch(`${supabaseUrl}/rest/v1/events?select=*`, {
        headers: {
          apikey: String(supabaseKey),
          Authorization: `Bearer ${String(supabaseKey)}`,
        },
        cache: 'no-store',
      });

      if (listResponse.ok) {
        const rows = (await listResponse.json()) as Record<string, unknown>[];
        const events = rows.map(mapRowToEvent);
        if (isDuplicateEvent(payload, events as any)) {
          return NextResponse.json(
            { error: 'Event already exists / 活动已存在' },
            { status: 409 }
          );
        }
      }

      const id = String(Date.now());
      const withNewColumns = {
        id,
        name: payload.name,
        date: payload.date,
        time: payload.time,
        location: payload.location,
        price: payload.price,
        age_range: payload.age_range,
        max_participants: payload.max_participants,
        organizer_name: payload.organizer_name,
        organizer_phone: payload.organizer_phone,
        status: payload.status,
        created_at: new Date().toISOString(),
      };
      const withLegacyColumns = {
        id,
        title: payload.name,
        date: payload.date,
        time: payload.time,
        location: payload.location,
        price: payload.price,
        seats: payload.max_participants,
        organizer_name: payload.organizer_name,
        organizer_phone: payload.organizer_phone,
        status: payload.status,
      };
      const withLegacyColumnsNoOrganizer = {
        id,
        title: payload.name,
        date: payload.date,
        time: payload.time,
        location: payload.location,
        price: payload.price,
        seats: payload.max_participants,
        status: payload.status,
      };

      let insertResponse = await fetch(`${supabaseUrl}/rest/v1/events`, {
        method: 'POST',
        headers: {
          apikey: String(supabaseKey),
          Authorization: `Bearer ${String(supabaseKey)}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(withNewColumns),
      });

      if (!insertResponse.ok) {
        insertResponse = await fetch(`${supabaseUrl}/rest/v1/events`, {
          method: 'POST',
          headers: {
            apikey: String(supabaseKey),
            Authorization: `Bearer ${String(supabaseKey)}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify(withLegacyColumns),
        });
      }

      if (!insertResponse.ok) {
        insertResponse = await fetch(`${supabaseUrl}/rest/v1/events`, {
          method: 'POST',
          headers: {
            apikey: String(supabaseKey),
            Authorization: `Bearer ${String(supabaseKey)}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify(withLegacyColumnsNoOrganizer),
        });
      }

      if (!insertResponse.ok) {
        const err = await insertResponse.text();
        return NextResponse.json(
          { error: err || 'Failed to create event' },
          { status: 500 }
        );
      }

      const createdRows = (await insertResponse.json()) as Record<string, unknown>[];
      return NextResponse.json(mapRowToEvent(createdRows[0] || withNewColumns));
    }

    if (isDuplicateEvent(payload, getEvents())) {
      return NextResponse.json(
        { error: 'Event already exists / 活动已存在' },
        { status: 409 }
      );
    }

    const event = saveEvent(payload);
    return NextResponse.json(event);
  } catch (error) {
    return NextResponse.json(
      { error: `POST /api/events failed: ${String(error)}` },
      { status: 500 }
    );
  }
}
