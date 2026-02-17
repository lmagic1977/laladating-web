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

export function listLocalUsers() {
  return localUsers.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name || "",
  }));
}

export function resetLocalUserPassword(userId: string, newPassword: string) {
  const target = localUsers.find((u) => u.id === userId);
  if (!target) return false;
  target.password = newPassword;
  return true;
}
