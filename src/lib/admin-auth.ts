export const ADMIN_AUTH_COOKIE = "lala_admin_session";

export function getAdminPassword() {
  return process.env.ADMIN_ACCESS_PASSWORD || "";
}

