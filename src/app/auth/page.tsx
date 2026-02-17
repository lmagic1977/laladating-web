"use client";

import { useState } from "react";

type Mode = "login" | "register";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const endpoint = mode === "login" ? "/api/user/login" : "/api/user/register";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data?.error || "Auth failed");
        return;
      }
      window.location.href = "/account";
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="neon-card p-6">
        <h1 className="text-2xl font-semibold">
          {mode === "login" ? "User Login / 用户登录" : "Create Account / 注册账号"}
        </h1>
        <p className="mt-2 text-sm text-white/60">
          {mode === "login"
            ? "Sign in to choose events and pay."
            : "Create account to register for events."}
        </p>
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          {mode === "register" ? (
            <div>
              <label className="mb-2 block text-sm text-white/70">Name / 姓名</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 outline-none focus:border-pink-500"
              />
            </div>
          ) : null}
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
            {loading ? "Please wait..." : mode === "login" ? "Sign in / 登录" : "Create account / 注册"}
          </button>
        </form>

        <button
          className="mt-4 text-sm text-cyan-300 hover:text-cyan-200"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login"
            ? "No account? Create one / 还没有账号？去注册"
            : "Already have account? Login / 已有账号？去登录"}
        </button>
      </div>
    </div>
  );
}
