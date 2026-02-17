import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { USER_AUTH_COOKIE, verifyUserSessionToken } from "@/lib/user-auth";
import { purchasePackage } from "@/lib/user-finance";

function getUser() {
  const token = cookies().get(USER_AUTH_COOKIE)?.value;
  return verifyUserSessionToken(token);
}

export async function POST(request: Request) {
  const user = getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const packageId = String(body?.packageId || "");
  if (!packageId) return NextResponse.json({ error: "packageId required" }, { status: 400 });

  try {
    const state = purchasePackage(user.userId, packageId);
    return NextResponse.json({ ok: true, ...state });
  } catch (error) {
    const message =
      error instanceof Error && error.message === "INSUFFICIENT_WALLET"
        ? "Insufficient wallet balance / 余额不足"
        : error instanceof Error && error.message === "PACKAGE_NOT_FOUND"
        ? "Package not found / 套餐不存在"
        : `Purchase failed: ${String(error)}`;
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
