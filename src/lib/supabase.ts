const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase environment variables");
}

const baseHeaders = {
  apikey: SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

export const supabaseGet = async <T>(table: string): Promise<T> => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
    headers: baseHeaders,
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Supabase GET ${table} failed`);
  }
  return (await res.json()) as T;
};

export const supabaseInsert = async <T>(table: string, payload: unknown): Promise<T> => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...baseHeaders, Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Supabase INSERT ${table} failed`);
  }
  return (await res.json()) as T;
};

export const supabaseUpdate = async <T>(table: string, id: string, payload: unknown): Promise<T> => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...baseHeaders, Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Supabase UPDATE ${table} failed`);
  }
  return (await res.json()) as T;
};

export const supabaseDelete = async <T>(table: string, id: string): Promise<T> => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "DELETE",
    headers: { ...baseHeaders, Prefer: "return=representation" },
  });
  if (!res.ok) {
    throw new Error(`Supabase DELETE ${table} failed`);
  }
  return (await res.json()) as T;
};

export const supabaseUpload = async (filename: string, dataUrl: string) => {
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!matches) throw new Error("Invalid data URL");
  const contentType = matches[1];
  const buffer = Buffer.from(matches[2], "base64");
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");

  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/photos/${safeName}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: buffer,
  });
  if (!res.ok) {
    throw new Error("Upload failed");
  }
  return `${SUPABASE_URL}/storage/v1/object/public/photos/${safeName}`;
};
