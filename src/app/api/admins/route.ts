import { NextResponse } from "next/server";
import { supabaseGet, supabaseInsert } from "@/lib/supabase";
import type { AdminUser } from "@/lib/db";

export const GET = async () => {
  const admins = await supabaseGet<AdminUser[]>("admins");
  return NextResponse.json(admins);
};

export const POST = async (req: Request) => {
  const body = (await req.json()) as AdminUser;
  const admins = await supabaseInsert<AdminUser[]>("admins", body);
  return NextResponse.json(admins);
};
