import { NextResponse } from "next/server";
import { createUserSessionToken, USER_AUTH_COOKIE } from "@/lib/user-auth";
import { createLocalUser } from "@/lib/user-store";

function normalizeSupabaseUrl(url?: string) {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

const supabaseUrl = normalizeSupabaseUrl(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "");
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function canUseSupabaseAuth() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");
  const name = String(body?.name || "").trim();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  try {
    let userId = "";

    if (canUseSupabaseAuth()) {
      const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
        method: "POST",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, data: { name } }),
      });
      const data = await response.json();
      if (!response.ok) {
        return NextResponse.json({ error: data?.msg || data?.error_description || "Sign up failed" }, { status: 400 });
      }
      userId = data?.user?.id || "";
      if (!userId) {
        return NextResponse.json({ error: "User created but no user id returned" }, { status: 500 });
      }
    } else {
      const localUser = createLocalUser(email, password, name);
      userId = localUser.id;
    }

    const response = NextResponse.json({ ok: true, userId, email });
    response.cookies.set(USER_AUTH_COOKIE, createUserSessionToken(userId, email), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    const message = error instanceof Error && error.message === "USER_EXISTS"
      ? "User already exists"
      : `Sign up failed: ${String(error)}`;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
