import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { USER_AUTH_COOKIE, verifyUserSessionToken } from "@/lib/user-auth";
import { getLocalProfile, saveLocalProfile, UserProfile } from "@/lib/user-profile";

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

function getUser() {
  const token = cookies().get(USER_AUTH_COOKIE)?.value;
  return verifyUserSessionToken(token);
}

export async function GET() {
  const user = getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (hasSupabase()) {
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${encodeURIComponent(user.userId)}&select=*`,
        {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
          cache: "no-store",
        }
      );
      if (res.ok) {
        const rows = (await res.json()) as UserProfile[];
        if (rows[0]) return NextResponse.json(rows[0]);
      }
    } catch {
      // fallback local store
    }
  }

  const local = getLocalProfile(user.userId);
  return NextResponse.json(
    local || {
      user_id: user.userId,
      email: user.email,
      updated_at: new Date().toISOString(),
    }
  );
}

export async function POST(request: Request) {
  const user = getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const profile: UserProfile = {
    user_id: user.userId,
    email: user.email,
    age: body.age ? Number(body.age) : undefined,
    job: body.job || "",
    interests: body.interests || "",
    zodiac: body.zodiac || "",
    height_cm: body.height_cm ? Number(body.height_cm) : undefined,
    body_type: body.body_type || "",
    headshot_url: body.headshot_url || "",
    fullshot_url: body.fullshot_url || "",
    photos: Array.isArray(body.photos) ? body.photos : [],
    updated_at: new Date().toISOString(),
  };

  if (hasSupabase()) {
    try {
      const upsertRes = await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
        method: "POST",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify(profile),
      });
      if (upsertRes.ok) {
        const rows = (await upsertRes.json()) as UserProfile[];
        return NextResponse.json(rows[0] || profile);
      }
    } catch {
      // fallback local store
    }
  }

  saveLocalProfile(profile);
  return NextResponse.json(profile);
}
