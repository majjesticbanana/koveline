"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/session-provider";

type Mode = "login" | "signup";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const { refresh } = useSession();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          mode === "signup" ? { name: name || undefined, email, password } : { email, password },
        ),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        return;
      }
      // The navbar's session lives in a provider in the root layout, which a
      // client-side navigation does not remount — without this it would keep
      // showing "Sign in" until the next full page load.
      await refresh();
      const role = data.student?.role;
      router.replace(role === "ADMIN" ? "/admin" : next || "/account");
      router.refresh();
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-rise rounded-panel border border-line bg-surface p-7 shadow-glass">
      <h1 className="font-display text-2xl font-bold text-ink">
        {mode === "login" ? "Sign in" : "Create your account"}
      </h1>
      <p className="mt-1 text-sm text-cocoa">
        {mode === "login"
          ? "Welcome back — your saved decks are waiting."
          : "Optional, and free: an account keeps your marks and your place across devices."}
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === "signup" && (
          <Field label="Name (optional)">
            <input
              className="kv-input"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
        )}
        <Field label="Email">
          <input
            className="kv-input"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password">
          <input
            className="kv-input"
            type="password"
            required
            minLength={mode === "signup" ? 8 : undefined}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        {error && (
          <p className="rounded-ctl border border-red-line bg-red-bg px-3 py-2 text-sm text-red" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-ctl bg-teal px-4 py-2.5 font-bold text-accent-ink transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-cocoa">
        {mode === "login" ? "No account yet? " : "Already have an account? "}
        <button
          type="button"
          className="font-semibold text-teal-deep underline-offset-2 hover:underline"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
          }}
        >
          {mode === "login" ? "Create one" : "Sign in"}
        </button>
      </p>

      <p className="mt-3 text-center text-[0.8rem] text-cocoa">
        <Link href="/#subjects" className="underline-offset-2 hover:underline">
          Keep studying without an account
        </Link>
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-coffee">{label}</span>
      {children}
    </label>
  );
}
