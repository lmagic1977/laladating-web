import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getRegistrations, isDuplicateRegistration, saveRegistration } from '@/lib/db';
import { USER_AUTH_COOKIE, verifyUserSessionToken } from '@/lib/user-auth';
import { ADMIN_AUTH_COOKIE, getAdminSessionValue } from '@/lib/admin-auth';

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

function dedupeByUserAndEvent<T extends {
  event_id?: unknown;
  eventid?: unknown;
  eventId?: unknown;
  attendeeid?: unknown;
  attendeeId?: unknown;
  email?: unknown;
  created_at?: unknown;
  createdat?: unknown;
}>(rows: T[]) {
  const map = new Map<string, T>();
  for (const row of rows) {
    const eventId = String(row.event_id || row.eventid || row.eventId || '');
    const attendeeId = String(row.attendeeid || row.attendeeId || row.email || '');
    const key = `${eventId}::${attendeeId}`;
    const current = map.get(key);
    if (!current) {
      map.set(key, row);
      continue;
    }

    const currentTime = new Date(String(current.created_at || current.createdat || 0)).getTime() || 0;
    const nextTime = new Date(String(row.created_at || row.createdat || 0)).getTime() || 0;
    if (nextTime >= currentTime) {
      map.set(key, row);
    }
  }
  return Array.from(map.values());
}

export async function GET(request: Request) {
  const userToken = cookies().get(USER_AUTH_COOKIE)?.value;
  const userSession = verifyUserSessionToken(userToken);
  const adminSession = cookies().get(ADMIN_AUTH_COOKIE)?.value;
  const isAdmin = Boolean(adminSession && adminSession === getAdminSessionValue());

  if (!userSession && !isAdmin) {
    return NextResponse.json({ error: 'Please login first / 请先登录' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('event_id');
  const eventFilter = eventId ? `&eventid=eq.${encodeURIComponent(eventId)}` : '';

  if (hasSupabaseConfig()) {
    try {
      const registrationsSelect =
        'id,eventid,attendeeid,payment,status,createdat,name,email,phone,age,gender,looking_for,headshot_url,fullshot_url';
      const profileSelect = 'user_id,email,name,age,headshot_url,fullshot_url';

      const canReadAuthUsers =
        Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && supabaseUrl) && isAdmin;
      const regRequests = isAdmin
        ? [
            fetch(`${supabaseUrl}/rest/v1/registrations?select=${registrationsSelect}${eventFilter}`, {
              headers: {
                apikey: String(supabaseKey),
                Authorization: `Bearer ${String(supabaseKey)}`,
              },
              cache: 'no-store',
            }),
          ]
        : [
            fetch(
              `${supabaseUrl}/rest/v1/registrations?select=${registrationsSelect}&attendeeid=eq.${encodeURIComponent(
                String(userSession?.userId || '')
              )}${eventFilter}`,
              {
                headers: {
                  apikey: String(supabaseKey),
                  Authorization: `Bearer ${String(supabaseKey)}`,
                },
                cache: 'no-store',
              }
            ),
            fetch(
              `${supabaseUrl}/rest/v1/registrations?select=${registrationsSelect}&attendeeid=eq.${encodeURIComponent(
                String(userSession?.email || '').toLowerCase()
              )}${eventFilter}`,
              {
                headers: {
                  apikey: String(supabaseKey),
                  Authorization: `Bearer ${String(supabaseKey)}`,
                },
                cache: 'no-store',
              }
            ),
          ];

      const [regResponses, profileRes, authUsersRes] = await Promise.all([
        Promise.all(regRequests),
        fetch(
          isAdmin
            ? `${supabaseUrl}/rest/v1/user_profiles?select=${profileSelect}`
            : `${supabaseUrl}/rest/v1/user_profiles?select=${profileSelect}&user_id=eq.${encodeURIComponent(
                String(userSession?.userId || '')
              )}`,
          {
            headers: {
              apikey: String(supabaseKey),
              Authorization: `Bearer ${String(supabaseKey)}`,
            },
            cache: 'no-store',
          }
        ),
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

      const regRowsRaw = (
        await Promise.all(
          regResponses.map(async (res) =>
            res.ok ? ((await res.json()) as Record<string, unknown>[]) : []
          )
        )
      ).flat();
      const regRows = dedupeByUserAndEvent(regRowsRaw);
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

      const roleFiltered = isAdmin
        ? mapped
        : mapped.filter(
            (r) =>
              String((r as { email?: unknown }).email || '').toLowerCase() ===
                String(userSession?.email || '').toLowerCase()
          );

      return NextResponse.json(roleFiltered);
    } catch {
      // fall through to local fallback
    }
  }

  const local = getRegistrations();
  const dedupedLocal = dedupeByUserAndEvent(local);
  const roleFiltered = isAdmin
    ? dedupedLocal
    : dedupedLocal.filter(
        (r) =>
          String((r as { attendeeid?: unknown }).attendeeid || '').toLowerCase() ===
            String(userSession?.userId || '').toLowerCase() ||
          String((r as { email?: unknown }).email || '').toLowerCase() ===
            String(userSession?.email || '').toLowerCase()
      );
  const filtered = eventId
    ? roleFiltered.filter((r) => String(r.event_id) === String(eventId))
    : roleFiltered;
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
