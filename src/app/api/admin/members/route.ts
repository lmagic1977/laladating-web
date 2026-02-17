import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_AUTH_COOKIE, getAdminSessionValue } from "@/lib/admin-auth";
import { listLocalUsers } from "@/lib/user-store";
import { getWalletState } from "@/lib/user-finance";

function normalizeSupabaseUrl(url?: string) {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

const supabaseUrl = normalizeSupabaseUrl(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function isAdmin() {
  return cookies().get(ADMIN_AUTH_COOKIE)?.value === getAdminSessionValue();
}

function hasSupabaseAdmin() {
  return Boolean(supabaseUrl && serviceKey);
}

export async function GET() {
  if (!isAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (hasSupabaseAdmin()) {
    try {
      const [usersRes, profilesRes] = await Promise.all([
        fetch(`${supabaseUrl}/auth/v1/admin/users?page=1&per_page=200`, {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
          cache: "no-store",
        }),
        fetch(`${supabaseUrl}/rest/v1/user_profiles?select=*`, {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
          cache: "no-store",
        }),
      ]);

      if (usersRes.ok) {
        const usersJson = (await usersRes.json()) as { users?: Array<Record<string, unknown>> };
        const users = Array.isArray(usersJson?.users) ? usersJson.users : [];
        const profileRows = profilesRes.ok
          ? ((await profilesRes.json()) as Array<Record<string, unknown>>)
          : [];
        const profileByUserId = new Map(profileRows.map((row) => [String(row.user_id || ""), row]));

        const members = users.map((user) => {
          const id = String(user.id || "");
          const email = String(user.email || "");
          const profile = profileByUserId.get(id);
          const wallet = getWalletState(id);
          return {
            id,
            email,
            name: String((user.user_metadata as { name?: string } | undefined)?.name || profile?.name || ""),
            created_at: String(user.created_at || ""),
            wallet_balance: wallet.balance,
            wallet_passes: wallet.passes,
            profile: profile || null,
          };
        });

        return NextResponse.json(members);
      }
    } catch {
      // fall back to local
    }
  }

  const localMembers = listLocalUsers().map((user) => {
    const wallet = getWalletState(user.id);
    return {
      ...user,
      created_at: "",
      wallet_balance: wallet.balance,
      wallet_passes: wallet.passes,
      profile: null,
    };
  });

  return NextResponse.json(localMembers);
}
