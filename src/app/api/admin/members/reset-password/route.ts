import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_AUTH_COOKIE, getAdminSessionValue } from "@/lib/admin-auth";
import { resetLocalUserPassword } from "@/lib/user-store";

function normalizeSupabaseUrl(url?: string) {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

const supabaseUrl = normalizeSupabaseUrl(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function isAdmin() {
  return cookies().get(ADMIN_AUTH_COOKIE)?.value === getAdminSessionValue();
}

function hasSupabaseAdmin() {
  return Boolean(supabaseUrl && serviceKey);
}

export async function POST(request: Request) {
  if (!isAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const userId = String(body?.userId || "").trim();
  const newPassword = String(body?.newPassword || "").trim();

  if (!userId || !newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: "Invalid userId or password" }, { status: 400 });
  }

  if (hasSupabaseAdmin()) {
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
      method: "PUT",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: newPassword }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: data?.msg || data?.message || "Failed to reset password" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  }

  const changed = resetLocalUserPassword(userId, newPassword);
  if (!changed) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
