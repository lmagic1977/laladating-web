import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { USER_AUTH_COOKIE, verifyUserSessionToken } from "@/lib/user-auth";
import { getWalletState, topupWallet } from "@/lib/user-finance";

function getUser() {
  const token = cookies().get(USER_AUTH_COOKIE)?.value;
  return verifyUserSessionToken(token);
}

export async function GET() {
  const user = getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(getWalletState(user.userId));
}

export async function POST(request: Request) {
  const user = getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const amount = Number(body?.amount || 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }
  const balance = topupWallet(user.userId, amount);
  return NextResponse.json({ ok: true, balance });
}
