export const ADMIN_AUTH_COOKIE = "lala_admin_session";

export type AdminAccount = {
  email: string;
  password: string;
};

export function getAdminAccounts(): AdminAccount[] {
  const raw = process.env.ADMIN_USERS_JSON;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as AdminAccount[];
      return parsed.filter((u) => u.email && u.password);
    } catch {
      return [];
    }
  }

  const singlePassword = process.env.ADMIN_ACCESS_PASSWORD || "";
  if (!singlePassword) return [];

  return [
    {
      email: process.env.ADMIN_ACCESS_EMAIL || "admin@laladating.com",
      password: singlePassword,
    },
  ];
}

export function getAdminSessionValue() {
  return process.env.ADMIN_AUTH_SECRET || "change-this-admin-auth-secret";
}

export function isValidAdminLogin(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  const users = getAdminAccounts();
  return users.some((u) => u.email.toLowerCase() === normalized && u.password === password);
}
