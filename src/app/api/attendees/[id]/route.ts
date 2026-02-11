import { NextResponse } from "next/server";
import { supabaseUpdate } from "@/lib/supabase";
import type { Attendee } from "@/lib/db";

export const PATCH = async (req: Request, { params }: { params: { id: string } }) => {
  const body = await req.json();
  const attendees = await supabaseUpdate<Attendee[]>("attendees", params.id, body);
  return NextResponse.json(attendees);
};
