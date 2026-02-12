"use client";

import { useState } from "react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Login failed" }));
        setError(data.error || "Login failed");
        return;
      }
      window.location.href = "/admin";
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="neon-card p-6">
        <h1 className="text-2xl font-semibold">Admin Login / 管理员登录</h1>
        <p className="mt-2 text-sm text-white/60">
          Enter admin email and password to access dashboard.
        </p>
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-2 block text-sm text-white/70">Email / 邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 outline-none focus:border-pink-500"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-white/70">Password / 密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 outline-none focus:border-pink-500"
              required
            />
          </div>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="rounded-full px-5 py-2 text-sm font-semibold neon-button disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in / 登录"}
          </button>
        </form>
      </div>
    </div>
  );
}
