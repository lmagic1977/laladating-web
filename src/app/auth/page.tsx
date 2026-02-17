"use client";

import { useState } from "react";

type Mode = "login" | "register" | "forgot";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const endpoint = mode === "login" ? "/api/user/login" : mode === "register" ? "/api/user/register" : "/api/user/forgot-password";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const payload = mode === "forgot" ? { email } : { name, email, password };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = String(data?.error || "Auth failed");
        if (message.toLowerCase().includes("rate limit")) {
          setError("注册请求太频繁，请先登录或稍后重试 / Too many signup attempts, try login first.");
        } else {
          setError(message);
        }
        return;
      }

      if (mode === "forgot") {
        setSuccess("重置密码邮件已发送，请检查邮箱 / Reset email sent.");
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
          {mode === "login"
            ? "User Login / 用户登录"
            : mode === "register"
            ? "Create Account / 注册账号"
            : "Forgot Password / 找回密码"}
        </h1>
        <p className="mt-2 text-sm text-white/60">
          {mode === "login"
            ? "Sign in to join events."
            : mode === "register"
            ? "Create account to register for events."
            : "Enter your email to receive reset instructions."}
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

          {mode !== "forgot" ? (
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
          ) : null}

          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          {success ? <p className="text-sm text-green-300">{success}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="rounded-full px-5 py-2 text-sm font-semibold neon-button disabled:opacity-60"
          >
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Sign in / 登录"
              : mode === "register"
              ? "Create account / 注册"
              : "Send reset email / 发送重置邮件"}
          </button>
        </form>

        <div className="mt-4 space-y-2 text-sm">
          {mode !== "login" ? (
            <button className="text-cyan-300 hover:text-cyan-200" onClick={() => setMode("login")}>
              Back to login / 返回登录
            </button>
          ) : null}
          {mode === "login" ? (
            <>
              <button className="block text-cyan-300 hover:text-cyan-200" onClick={() => setMode("register")}>
                No account? Create one / 还没有账号？去注册
              </button>
              <button className="block text-cyan-300 hover:text-cyan-200" onClick={() => setMode("forgot")}>
                Forgot password? / 忘记密码
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
