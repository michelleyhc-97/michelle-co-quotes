"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Login failed.");
      window.location.href = from;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-5">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-border bg-surface p-8"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-semibold text-accent-ink">
            M
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-ink">Michelle & Co.</p>
            <p className="text-xs text-faint">Quotes</p>
          </div>
        </div>

        <h1 className="mt-6 text-lg font-semibold text-ink">Sign in</h1>
        <p className="mt-1 text-sm text-muted">Internal tool — boss & sales team only.</p>

        <div className="mt-6 space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-muted">Username</span>
            <input
              type="text"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="boss or sales"
              className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
            />
          </label>
        </div>

        {error && <p className="mt-3 text-sm font-medium text-status-rejected">{error}</p>}

        <button
          type="submit"
          disabled={loading || !username || !password}
          className="mt-5 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent/90 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <p className="mt-4 text-center text-xs text-faint">
          Demo accounts: boss / boss-demo-2026 · sales / sales-demo-2026
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
