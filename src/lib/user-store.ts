type LocalUser = {
  id: string;
  email: string;
  password: string;
  name?: string;
};

const localUsers: LocalUser[] = [];

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function createLocalUser(email: string, password: string, name?: string) {
  const normalized = normalizeEmail(email);
  if (localUsers.some((u) => u.email === normalized)) {
    throw new Error("USER_EXISTS");
  }
  const user: LocalUser = {
    id: String(Date.now()),
    email: normalized,
    password,
    name,
  };
  localUsers.push(user);
  return user;
}

export function loginLocalUser(email: string, password: string) {
  const normalized = normalizeEmail(email);
  const user = localUsers.find((u) => u.email === normalized && u.password === password);
  if (!user) return null;
  return user;
}
