type UserPass = {
  packageId: string;
  title: string;
  total: number;
  remaining: number;
  purchasedAt: string;
};

type WalletLedger = {
  id: string;
  userId: string;
  type: "topup" | "package" | "event";
  amount: number;
  note: string;
  createdAt: string;
};

export type PassPackage = {
  id: string;
  title: string;
  titleZh: string;
  credits: number;
  price: number;
  originalPrice: number;
};

const walletBalanceByUser = new Map<string, number>();
const userPassesByUser = new Map<string, UserPass[]>();
const walletLedger: WalletLedger[] = [];

export const passPackages: PassPackage[] = [
  { id: "pack_1", title: "Single Pass", titleZh: "单次票", credits: 1, price: 39, originalPrice: 39 },
  { id: "pack_3", title: "3-Pass Bundle", titleZh: "3次套餐", credits: 3, price: 99, originalPrice: 117 },
  { id: "pack_5", title: "5-Pass Bundle", titleZh: "5次套餐", credits: 5, price: 149, originalPrice: 195 },
];

function pushLedger(userId: string, type: WalletLedger["type"], amount: number, note: string) {
  walletLedger.push({
    id: String(Date.now() + Math.random()),
    userId,
    type,
    amount,
    note,
    createdAt: new Date().toISOString(),
  });
}

export function getWalletState(userId: string) {
  return {
    balance: walletBalanceByUser.get(userId) || 0,
    passes: userPassesByUser.get(userId) || [],
    ledger: walletLedger.filter((x) => x.userId === userId).slice(-20).reverse(),
  };
}

export function topupWallet(userId: string, amount: number) {
  const current = walletBalanceByUser.get(userId) || 0;
  const next = current + amount;
  walletBalanceByUser.set(userId, next);
  pushLedger(userId, "topup", amount, "Wallet top-up");
  return next;
}

export function purchasePackage(userId: string, packageId: string) {
  const pkg = passPackages.find((p) => p.id === packageId);
  if (!pkg) throw new Error("PACKAGE_NOT_FOUND");

  const current = walletBalanceByUser.get(userId) || 0;
  if (current < pkg.price) throw new Error("INSUFFICIENT_WALLET");
  walletBalanceByUser.set(userId, current - pkg.price);

  const passes = userPassesByUser.get(userId) || [];
  passes.push({
    packageId: pkg.id,
    title: pkg.title,
    total: pkg.credits,
    remaining: pkg.credits,
    purchasedAt: new Date().toISOString(),
  });
  userPassesByUser.set(userId, passes);
  pushLedger(userId, "package", -pkg.price, `Purchase ${pkg.title}`);
  return getWalletState(userId);
}

export function chargeForEvent(userId: string, amount: number) {
  if (amount <= 0) return { method: "free" as const };

  const passes = userPassesByUser.get(userId) || [];
  const pass = passes.find((p) => p.remaining > 0);
  if (pass) {
    pass.remaining -= 1;
    userPassesByUser.set(userId, passes);
    pushLedger(userId, "event", 0, `Use pass for event (${pass.title})`);
    return { method: "pass" as const, packageId: pass.packageId };
  }

  const current = walletBalanceByUser.get(userId) || 0;
  if (current < amount) throw new Error("INSUFFICIENT_BALANCE");
  walletBalanceByUser.set(userId, current - amount);
  pushLedger(userId, "event", -amount, "Pay event from wallet");
  return { method: "wallet" as const };
}

export function refundForEvent(userId: string, payment: string) {
  const value = String(payment || "");
  if (value.startsWith("wallet:$")) {
    const amount = Number(value.replace("wallet:$", ""));
    if (Number.isFinite(amount) && amount > 0) {
      const current = walletBalanceByUser.get(userId) || 0;
      walletBalanceByUser.set(userId, current + amount);
      pushLedger(userId, "event", amount, "Refund to wallet");
    }
    return { method: "wallet_refund" as const };
  }

  if (value.startsWith("pass:")) {
    const packageId = value.replace("pass:", "");
    const passes = userPassesByUser.get(userId) || [];
    const pass = passes.find((p) => p.packageId === packageId);
    if (pass) {
      pass.remaining = Math.min(pass.total, pass.remaining + 1);
      userPassesByUser.set(userId, passes);
      pushLedger(userId, "event", 0, `Refund pass credit (${pass.title})`);
    }
    return { method: "pass_refund" as const, packageId };
  }

  return { method: "none" as const };
}
