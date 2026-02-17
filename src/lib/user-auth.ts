import { createHmac } from "crypto";

export const USER_AUTH_COOKIE = "lala_user_session";

type UserSession = {
  userId: string;
  email: string;
  exp: number;
};

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function getSecret() {
  return process.env.USER_AUTH_SECRET || process.env.ADMIN_AUTH_SECRET || "change-this-user-auth-secret";
}

function base64Url(input: string) {
  return Buffer.from(input).toString("base64url");
}

function decodeBase64Url(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function signPayload(encodedPayload: string) {
  return createHmac("sha256", getSecret()).update(encodedPayload).digest("base64url");
}

export function createUserSessionToken(userId: string, email: string) {
  const payload: UserSession = {
    userId,
    email,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encodedPayload = base64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyUserSessionToken(token?: string | null): UserSession | null {
  if (!token) return null;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;
  const expected = signPayload(encodedPayload);
  if (expected !== signature) return null;
  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as UserSession;
    if (!payload.userId || !payload.email || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
