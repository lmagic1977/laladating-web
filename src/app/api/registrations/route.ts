import { NextResponse } from "next/server";
import { supabaseGet, supabaseInsert } from "@/lib/supabase";
import type { Registration } from "@/lib/db";

export const GET = async () => {
  const regs = await supabaseGet<Registration[]>("registrations");
  return NextResponse.json(regs);
};

export const POST = async (req: Request) => {
  const body = (await req.json()) as Registration;
  const regs = await supabaseInsert<Registration[]>("registrations", body);
  return NextResponse.json(regs);
};
