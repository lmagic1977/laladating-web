import { NextResponse } from "next/server";
import { supabaseDelete, supabaseUpdate } from "@/lib/supabase";
import type { EventItem } from "@/lib/db";

export const PUT = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const body = await req.json();
  const events = await supabaseUpdate<EventItem[]>("events", id, body);
  return NextResponse.json(events);
};

export const DELETE = async (
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const events = await supabaseDelete<EventItem[]>("events", id);
  return NextResponse.json(events);
};
