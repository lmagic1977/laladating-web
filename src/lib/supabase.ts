function normalizeSupabaseUrl(url?: string) {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://${trimmed}`;
}

const supabaseUrl = normalizeSupabaseUrl(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
);
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);
export const supabase = null;

function headers(extra?: Record<string, string>) {
  return {
    apikey: String(supabaseKey || ''),
    Authorization: `Bearer ${String(supabaseKey || '')}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

export async function supabaseGet<T>(table: string): Promise<T> {
  if (!isSupabaseConfigured) return [] as T;
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*`, {
    headers: headers(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}

export async function supabaseInsert<T>(table: string, payload: unknown): Promise<T> {
  if (!isSupabaseConfigured) return [payload] as T;
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
    method: 'POST',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}

export async function supabaseUpdate<T>(
  table: string,
  id: string,
  payload: unknown
): Promise<T> {
  if (!isSupabaseConfigured) return [payload] as T;
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: headers({ Prefer: 'return=representation' }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}

export async function supabaseUpload(filename: string, dataUrl: string): Promise<string> {
  if (!isSupabaseConfigured) return dataUrl;
  const bucket = 'uploads';
  const raw = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  const bytes = Buffer.from(raw, 'base64');
  const res = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${encodeURIComponent(filename)}`, {
    method: 'POST',
    headers: {
      apikey: String(supabaseKey || ''),
      Authorization: `Bearer ${String(supabaseKey || '')}`,
      'Content-Type': 'application/octet-stream',
      'x-upsert': 'true',
    },
    body: bytes,
  });
  if (!res.ok) throw new Error(await res.text());
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodeURIComponent(filename)}`;
}
