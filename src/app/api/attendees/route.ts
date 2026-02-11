import { NextResponse } from "next/server";
import { supabaseGet, supabaseInsert } from "@/lib/supabase";
import type { Attendee } from "@/lib/db";

export const GET = async () => {
  const attendees = await supabaseGet<Attendee[]>("attendees");
  return NextResponse.json(attendees);
};

export const POST = async (req: Request) => {
  const body = (await req.json()) as Attendee;
  const attendees = await supabaseInsert<Attendee[]>("attendees", body);
  return NextResponse.json(attendees);
};
