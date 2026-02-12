import { NextResponse } from "next/server";
import { ADMIN_AUTH_COOKIE, getAdminPassword } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const body = await request.json();
  const password = String(body?.password || "");
  const expected = getAdminPassword();

  if (!expected) {
    return NextResponse.json(
      { error: "ADMIN_ACCESS_PASSWORD is not configured" },
      { status: 500 }
    );
  }

  if (password !== expected) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_AUTH_COOKIE, "ok", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}

