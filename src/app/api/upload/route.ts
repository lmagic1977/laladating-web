import { NextResponse } from "next/server";
import { supabaseUpload } from "@/lib/supabase";

export const POST = async (req: Request) => {
  const body = await req.json();
  const { filename, dataUrl } = body as { filename: string; dataUrl: string };
  if (!filename || !dataUrl) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  try {
    const url = await supabaseUpload(filename, dataUrl);
    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
};
