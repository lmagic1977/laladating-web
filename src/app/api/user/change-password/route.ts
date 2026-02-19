import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { USER_AUTH_COOKIE, verifyUserSessionToken } from "@/lib/user-auth";
import { loginLocalUser, resetLocalUserPassword } from "@/lib/user-store";

function normalizeSupabaseUrl(url?: string) {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

const supabaseUrl = normalizeSupabaseUrl(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "");
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function canUseSupabaseAuth() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

function canUseSupabaseAdmin() {
  return Boolean(supabaseUrl && supabaseServiceRoleKey);
}

export async function POST(request: Request) {
  const token = cookies().get(USER_AUTH_COOKIE)?.value;
  const session = verifyUserSessionToken(token);
  if (!session) {
    return NextResponse.json({ error: "Please login first / 请先登录" }, { status: 401 });
  }

  const body = await request.json();
  const currentPassword = String(body?.currentPassword || "");
  const newPassword = String(body?.newPassword || "");

  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters / 新密码至少 6 位" },
      { status: 400 }
    );
  }

  if (currentPassword === newPassword) {
    return NextResponse.json(
      { error: "New password must be different / 新旧密码不能相同" },
      { status: 400 }
    );
  }

  if (canUseSupabaseAuth()) {
    const verifyRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: session.email, password: currentPassword }),
    });

    if (!verifyRes.ok) {
      return NextResponse.json({ error: "Current password is incorrect / 当前密码错误" }, { status: 400 });
    }

    if (!canUseSupabaseAdmin()) {
      return NextResponse.json(
        { error: "Server is missing service key for password update / 服务端缺少密码更新权限" },
        { status: 500 }
      );
    }

    const updateRes = await fetch(
      `${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(session.userId)}`,
      {
        method: "PUT",
        headers: {
          apikey: supabaseServiceRoleKey,
          Authorization: `Bearer ${supabaseServiceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: newPassword }),
      }
    );

    if (!updateRes.ok) {
      const data = await updateRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: data?.msg || data?.message || "Failed to change password / 修改密码失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  }

  const localUser = loginLocalUser(session.email, currentPassword);
  if (!localUser) {
    return NextResponse.json({ error: "Current password is incorrect / 当前密码错误" }, { status: 400 });
  }
  const changed = resetLocalUserPassword(localUser.id, newPassword);
  if (!changed) {
    return NextResponse.json({ error: "User not found / 用户不存在" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
