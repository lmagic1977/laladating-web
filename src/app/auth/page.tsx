"use client";

import { useState } from "react";

type Mode = "login" | "register" | "forgot";

export default function AuthPage() {
  const toEnglish = (message: unknown) => {
    const text = String(message || "");
    const parts = text.split(/\s*\/\s*/);
    const english = parts.find((p) => /[A-Za-z]/.test(p));
    return (english || text).trim();
  };
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
        const message = toEnglish(data?.error || "Auth failed");
        if (message.toLowerCase().includes("rate limit")) {
          setError("Too many signup attempts. Try login first or retry later.");
        } else {
          setError(message);
        }
        return;
      }

      if (mode === "forgot") {
        setSuccess("Reset email sent. Please check your inbox.");
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
            ? "User Login"
            : mode === "register"
            ? "Create Account"
            : "Forgot Password"}
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
              <label className="mb-2 block text-sm text-white/70">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 outline-none focus:border-pink-500"
              />
            </div>
          ) : null}

          <div>
            <label className="mb-2 block text-sm text-white/70">Email</label>
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
              <label className="mb-2 block text-sm text-white/70">Password</label>
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
              ? "Sign in"
              : mode === "register"
              ? "Create account"
              : "Send reset email"}
          </button>
        </form>

        <div className="mt-4 space-y-2 text-sm">
          {mode !== "login" ? (
            <button className="text-cyan-300 hover:text-cyan-200" onClick={() => setMode("login")}>
              Back to login
            </button>
          ) : null}
          {mode === "login" ? (
            <>
              <button
                className="block rounded-lg border border-pink-400/40 bg-pink-500/15 px-3 py-2 text-base font-semibold text-pink-200 hover:bg-pink-500/25 hover:text-pink-100"
                onClick={() => setMode("register")}
              >
                No account? Create one
              </button>
              <button className="block text-cyan-300 hover:text-cyan-200" onClick={() => setMode("forgot")}>
                Forgot password?
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
