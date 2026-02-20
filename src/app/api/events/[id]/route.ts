import { NextResponse } from 'next/server';
import { updateEventStatusById } from '@/lib/db';

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

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const { id } = await Promise.resolve(params);

  if (hasSupabaseConfig()) {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/events?id=eq.${encodeURIComponent(String(id))}`,
      {
        method: 'PATCH',
        headers: {
          apikey: String(supabaseKey),
          Authorization: `Bearer ${String(supabaseKey)}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'closed' }),
      }
    );
    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: err || 'Failed to close event' }, { status: 500 });
    }
    return NextResponse.json({ success: true, status: 'closed' });
  }

  const eventId = Number(id);
  if (Number.isNaN(eventId)) return NextResponse.json({ error: 'Invalid event id' }, { status: 400 });

  const updated = updateEventStatusById(eventId, 'closed');
  if (!updated) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, status: 'closed' });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const { id } = await Promise.resolve(params);
  const body = await request.json().catch(() => ({}));
  const nextStatus = body?.status === 'active' ? 'active' : body?.status === 'closed' ? 'closed' : '';
  if (!nextStatus) {
    return NextResponse.json({ error: 'status must be active or closed' }, { status: 400 });
  }

  if (hasSupabaseConfig()) {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/events?id=eq.${encodeURIComponent(String(id))}`,
      {
        method: 'PATCH',
        headers: {
          apikey: String(supabaseKey),
          Authorization: `Bearer ${String(supabaseKey)}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({ status: nextStatus }),
      }
    );
    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: err || 'Failed to update event status' }, { status: 500 });
    }
    return NextResponse.json({ success: true, status: nextStatus });
  }

  const eventId = Number(id);
  if (Number.isNaN(eventId)) return NextResponse.json({ error: 'Invalid event id' }, { status: 400 });
  const updated = updateEventStatusById(eventId, nextStatus);
  if (!updated) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, status: nextStatus });
}
