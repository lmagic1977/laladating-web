import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_AUTH_COOKIE, getAdminSessionValue } from "@/lib/admin-auth";
import { topupWallet } from "@/lib/user-finance";

function isAdmin() {
  return cookies().get(ADMIN_AUTH_COOKIE)?.value === getAdminSessionValue();
}

export async function POST(request: Request) {
  if (!isAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const userId = String(body?.userId || "").trim();
  const amount = Number(body?.amount || 0);

  if (!userId || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid userId or amount" }, { status: 400 });
  }

  const balance = topupWallet(userId, amount);
  return NextResponse.json({ ok: true, balance });
}
