import { NextResponse } from "next/server";
import { supabaseGet, supabaseInsert } from "@/lib/supabase";
import type { EventItem } from "@/lib/db";

export const GET = async () => {
  const events = await supabaseGet<EventItem[]>("events");
  return NextResponse.json(events);
};

export const POST = async (req: Request) => {
  const body = (await req.json()) as EventItem;
  const events = await supabaseInsert<EventItem[]>("events", body);
  return NextResponse.json(events);
};
