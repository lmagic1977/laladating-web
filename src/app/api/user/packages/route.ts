import { NextResponse } from "next/server";
import { passPackages } from "@/lib/user-finance";

export async function GET() {
  return NextResponse.json(passPackages);
}
