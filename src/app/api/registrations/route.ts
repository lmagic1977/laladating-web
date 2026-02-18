import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getRegistrations, isDuplicateRegistration, saveRegistration } from '@/lib/db';
import { USER_AUTH_COOKIE, verifyUserSessionToken } from '@/lib/user-auth';

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('event_id');

  if (hasSupabaseConfig()) {
    try {
      const canReadAuthUsers = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && supabaseUrl);
      const [regRes, profileRes, authUsersRes] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/registrations?select=*`, {
          headers: {
            apikey: String(supabaseKey),
            Authorization: `Bearer ${String(supabaseKey)}`,
          },
          cache: 'no-store',
        }),
        fetch(`${supabaseUrl}/rest/v1/user_profiles?select=*`, {
          headers: {
            apikey: String(supabaseKey),
            Authorization: `Bearer ${String(supabaseKey)}`,
          },
          cache: 'no-store',
        }),
        canReadAuthUsers
          ? fetch(`${supabaseUrl}/auth/v1/admin/users?page=1&per_page=200`, {
              headers: {
                apikey: String(process.env.SUPABASE_SERVICE_ROLE_KEY),
                Authorization: `Bearer ${String(process.env.SUPABASE_SERVICE_ROLE_KEY)}`,
              },
              cache: 'no-store',
            })
          : Promise.resolve(new Response('[]', { status: 200 })),
      ]);

      const regRows = regRes.ok ? ((await regRes.json()) as Record<string, unknown>[]) : [];
      const profileRows = profileRes.ok ? ((await profileRes.json()) as Record<string, unknown>[]) : [];
      const profileMap = new Map(profileRows.map((p) => [String(p.user_id || ''), p]));
      const authJson = authUsersRes.ok
        ? ((await authUsersRes.json()) as { users?: Array<Record<string, unknown>> })
        : { users: [] };
      const authUsers = Array.isArray(authJson.users) ? authJson.users : [];
      const authUserMap = new Map(authUsers.map((u) => [String(u.id || ''), u]));

      const mapped = regRows.map((row) => {
        const eventVal = String(row.event_id || row.eventid || row.eventId || '');
        const attendeeId = String(row.attendeeid || row.attendeeId || '');
        const profile = profileMap.get(attendeeId);
        const authUser = authUserMap.get(attendeeId);
        const authEmail = String(authUser?.email || '');
        const rowEmail = String(row.email || '');
        const normalizedRowEmail = rowEmail.includes('@') ? rowEmail : '';
        const email = String(normalizedRowEmail || profile?.email || authEmail || '');
        const rawName = String(
          row.name ||
          (authUser?.user_metadata as { name?: string } | undefined)?.name ||
          profile?.name ||
          ''
        );
        const looksLikeUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rawName);
        const fallbackName = email.includes('@') ? email.split('@')[0] : '未填写姓名';

        return {
          id: Number(row.id || Date.now()),
          name: rawName && !looksLikeUuid ? rawName : fallbackName,
          email: email || '未填写邮箱',
          phone: String(row.phone || ''),
          age: Number(row.age || profile?.age || 0),
          gender: String(row.gender || ''),
          looking_for: String(row.looking_for || row.lookingFor || ''),
          event_id: eventVal,
          headshot_url: String(row.headshot_url || profile?.headshot_url || ''),
          fullshot_url: String(row.fullshot_url || profile?.fullshot_url || ''),
          created_at: String(row.created_at || row.createdat || new Date().toISOString()),
          status: String(row.status || ''),
          payment: String(row.payment || ''),
        };
      });

      const filtered = eventId
        ? mapped.filter((r) => String(r.event_id) === String(eventId))
        : mapped;
      return NextResponse.json(filtered);
    } catch {
      // fall through to local fallback
    }
  }

  const local = getRegistrations();
  const filtered = eventId
    ? local.filter((r) => String(r.event_id) === String(eventId))
    : local;
  return NextResponse.json(filtered);
}

export async function POST(request: Request) {
  const token = cookies().get(USER_AUTH_COOKIE)?.value;
  const session = verifyUserSessionToken(token);
  if (!session) {
    return NextResponse.json({ error: 'Please login first / 请先登录' }, { status: 401 });
  }

  const data = await request.json();
  const lookingFor = data.looking_for || data.lookingFor;
  const eventId = String(data.event_id || data.eventId || '').trim();
  const registrations = getRegistrations();
  
  if (!data.name || !data.email || !data.phone || !data.age || !data.gender || !lookingFor || !data.headshot_url || !data.fullshot_url || !eventId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const payload = {
    name: data.name,
    email: data.email,
    phone: data.phone,
    age: Number.parseInt(String(data.age), 10),
    gender: data.gender,
    looking_for: lookingFor,
    event_id: eventId,
    headshot_url: data.headshot_url,
    fullshot_url: data.fullshot_url,
  };

  if (isDuplicateRegistration(payload, registrations)) {
    return NextResponse.json(
      { error: 'You are already registered for this event / 您已报名该活动' },
      { status: 409 }
    );
  }
  
  if (hasSupabaseConfig()) {
    try {
      const supaPayload = {
        id: String(Date.now()),
        attendeeid: String(data.email).toLowerCase(),
        eventid: eventId,
        payment: 'manual:pending',
        status: 'registered',
        createdat: new Date().toISOString(),
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        age: payload.age,
        gender: payload.gender,
        looking_for: payload.looking_for,
        headshot_url: payload.headshot_url,
        fullshot_url: payload.fullshot_url,
      };

      const insertRes = await fetch(`${supabaseUrl}/rest/v1/registrations`, {
        method: 'POST',
        headers: {
          apikey: String(supabaseKey),
          Authorization: `Bearer ${String(supabaseKey)}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(supaPayload),
      });

      if (insertRes.ok) {
        const created = (await insertRes.json()) as Record<string, unknown>[];
        return NextResponse.json(created[0] || supaPayload);
      }

      const minimalPayload = {
        id: String(Date.now()),
        attendeeid: String(data.email).toLowerCase(),
        eventid: eventId,
        payment: 'manual:pending',
        status: 'registered',
        createdat: new Date().toISOString(),
      };
      const retryRes = await fetch(`${supabaseUrl}/rest/v1/registrations`, {
        method: 'POST',
        headers: {
          apikey: String(supabaseKey),
          Authorization: `Bearer ${String(supabaseKey)}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(minimalPayload),
      });
      if (retryRes.ok) {
        const created = (await retryRes.json()) as Record<string, unknown>[];
        return NextResponse.json(created[0] || minimalPayload);
      }
    } catch {
      // fallback local
    }
  }

  const registration = saveRegistration(payload);
  return NextResponse.json(registration);
}
