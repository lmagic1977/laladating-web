import { NextResponse } from "next/server";

function normalizeSupabaseUrl(url?: string) {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

const supabaseUrl = normalizeSupabaseUrl(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "");
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function canUseSupabaseAuth() {
  return Boolean(supabaseUrl && anonKey);
}

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body?.email || "").trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  if (!canUseSupabaseAuth()) {
    return NextResponse.json({
      ok: true,
      message: "If this email exists, reset instructions have been sent.",
    });
  }

  const origin = new URL(request.url).origin;
  const redirectTo = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth`
    : `${origin}/auth`;

  const response = await fetch(`${supabaseUrl}/auth/v1/recover`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, redirect_to: redirectTo }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(
      { error: data?.error_description || data?.msg || "Failed to send reset email" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "If this email exists, reset instructions have been sent.",
  });
}
