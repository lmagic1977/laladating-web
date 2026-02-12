import { NextResponse } from "next/server";
import {
  ADMIN_AUTH_COOKIE,
  getAdminAccounts,
  getAdminSessionValue,
  isValidAdminLogin,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body?.email || "");
  const password = String(body?.password || "");
  const accounts = getAdminAccounts();

  if (!accounts.length) {
    return NextResponse.json(
      { error: "No admin accounts configured" },
      { status: 500 }
    );
  }

  if (!isValidAdminLogin(email, password)) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_AUTH_COOKIE, getAdminSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}
