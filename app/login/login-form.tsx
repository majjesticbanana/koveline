"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/session-provider";
import siteCopy from "@/content/site-copy.json";

const copy = siteCopy.auth;

type Mode = "login" | "signup";

/**
 * Sign in and sign up are the same short form behind two tabs, because the
 * old "No account yet? Create one" line at the bottom made a second screen out
 * of what is really one choice. Every string comes from site-copy.json.
 */
export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const { refresh } = useSession();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const signup = mode === "signup";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          signup ? { name: name || undefined, email, password } : { email, password },
        ),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? copy.errorGeneric);
        return;
      }
      // The navbar's session lives in a provider in the root layout, which a
      // client-side navigation does not remount, and without this it would keep
      // showing "Sign in" until the next full page load.
      await refresh();
      // Straight back to studying: wherever they came from, or the home page,
      // which carries the "continue" card. Never a settings screen.
      router.replace(next || (data.student?.role === "ADMIN" ? "/admin" : "/"));
      router.refresh();
    } catch {
      setError(copy.errorNetwork);
    } finally {
      setBusy(false);
    }
  }

  function choose(next: Mode) {
    if (next === mode) return;
    setMode(next);
    setError(null);
  }

  return (
    <div className="auth-card animate-rise rounded-panel border border-line bg-surface p-6 shadow-glass sm:p-7">
      <h1 className="sr-only">{signup ? copy.signUpTitle : copy.signInTitle}</h1>

      <div className="auth-tabs" role="group" aria-label={copy.signInTitle}>
        <button type="button" aria-pressed={!signup} onClick={() => choose("login")}>
          {copy.signInTitle}
        </button>
        <button type="button" aria-pressed={signup} onClick={() => choose("signup")}>
          {copy.signUpTitle}
        </button>
      </div>

      <p className="mt-3 text-center text-sm text-cocoa">
        {signup ? copy.signUpNote : copy.signInNote}
      </p>

      <form onSubmit={submit} className="mt-5 space-y-3.5">
        {signup && (
          <Field label={copy.name} note={copy.optional}>
            <input
              className="kv-input"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
        )}
        <Field label={copy.email}>
          <input
            className="kv-input"
            type="email"
            required
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label={copy.password}>
          <input
            className="kv-input"
            type="password"
            required
            minLength={signup ? 8 : undefined}
            autoComplete={signup ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        {error && (
          <p className="rounded-ctl border border-red-line bg-red-bg px-3 py-2 text-sm text-red" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="auth-submit">
          {busy ? copy.working : signup ? copy.signUpTitle : copy.signInTitle}
        </button>
      </form>

      <p className="mt-4 text-center">
        <Link href="/" className="text-[0.82rem] text-cocoa underline-offset-2 hover:text-teal-deep hover:underline">
          {copy.skip}
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  note,
  children,
}: {
  label: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline gap-1.5 text-sm font-semibold text-coffee">
        {label}
        {note && <span className="text-[0.72rem] font-medium text-cocoa">{note}</span>}
      </span>
      {children}
    </label>
  );
}
