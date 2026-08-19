"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type AdminStudent = {
  id: string;
  email: string;
  name: string | null;
  role: "STUDENT" | "ADMIN";
  disabled: boolean;
  createdAt: string | Date;
};

export function StudentsManager({
  initial,
  currentAdminId,
}: {
  initial: AdminStudent[];
  currentAdminId: string;
}) {
  const router = useRouter();
  const [students, setStudents] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null); // id being mutated

  async function api(path: string, init: RequestInit): Promise<any | null> {
    setError(null);
    const res = await fetch(path, {
      headers: { "content-type": "application/json" },
      ...init,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Request failed.");
      return null;
    }
    return data;
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setPending(id);
    const data = await api(`/api/admin/students/${id}`, { method: "PATCH", body: JSON.stringify(body) });
    if (data?.student) {
      setStudents((list) => list.map((s) => (s.id === id ? { ...s, ...data.student } : s)));
    }
    setPending(null);
  }

  async function remove(id: string) {
    setPending(id);
    const data = await api(`/api/admin/students/${id}`, { method: "DELETE" });
    if (data?.ok) setStudents((list) => list.filter((s) => s.id !== id));
    setPending(null);
  }

  return (
    <div className="space-y-6">
      <CreateForm
        onCreated={(s) => {
          setStudents((list) => [s, ...list]);
          router.refresh();
        }}
        onError={setError}
      />

      {error && (
        <p className="rounded-ctl border border-red-line bg-red-bg px-3 py-2 text-sm text-red" role="alert">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-panel border border-line bg-surface shadow-glass">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-cocoa">
              <Th>Account</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Created</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => {
              const self = s.id === currentAdminId;
              const busy = pending === s.id;
              return (
                <tr key={s.id} className="border-b border-line/60 last:border-0 align-middle">
                  <Td>
                    <div className="font-semibold text-ink">{s.name ?? "—"}</div>
                    <div className="text-cocoa">{s.email}</div>
                  </Td>
                  <Td>
                    <Badge tone={s.role === "ADMIN" ? "accent" : "muted"}>
                      {s.role === "ADMIN" ? "Admin" : "Student"}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge tone={s.disabled ? "red" : "green"}>
                      {s.disabled ? "Disabled" : "Active"}
                    </Badge>
                  </Td>
                  <Td className="whitespace-nowrap text-cocoa">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </Td>
                  <Td className="text-right">
                    <div className="inline-flex flex-wrap justify-end gap-2">
                      <Action
                        disabled={busy || self}
                        onClick={() => patch(s.id, { role: s.role === "ADMIN" ? "STUDENT" : "ADMIN" })}
                        title={self ? "You can't change your own role" : undefined}
                      >
                        {s.role === "ADMIN" ? "Make student" : "Make admin"}
                      </Action>
                      <Action
                        disabled={busy || self}
                        onClick={() => patch(s.id, { disabled: !s.disabled })}
                        title={self ? "You can't disable your own account" : undefined}
                      >
                        {s.disabled ? "Enable" : "Disable"}
                      </Action>
                      <Action
                        disabled={busy || self}
                        tone="danger"
                        onClick={() => remove(s.id)}
                        title={self ? "You can't delete your own account" : undefined}
                      >
                        Delete
                      </Action>
                    </div>
                  </Td>
                </tr>
              );
            })}
            {students.length === 0 && (
              <tr>
                <Td className="py-8 text-center text-cocoa" colSpan={5}>
                  No accounts yet.
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CreateForm({
  onCreated,
  onError,
}: {
  onCreated: (s: AdminStudent) => void;
  onError: (msg: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"STUDENT" | "ADMIN">("STUDENT");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/admin/students", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: name || undefined, email, password, role }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      onError(data.error ?? "Could not create the account.");
      return;
    }
    onCreated(data.student);
    setName("");
    setEmail("");
    setPassword("");
    setRole("STUDENT");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-ctl bg-teal px-4 py-2 text-sm font-bold text-accent-ink transition-opacity hover:opacity-90"
      >
        + New student
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-panel border border-line bg-surface p-5 shadow-glass">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-coffee">Name (optional)</span>
          <input className="kv-input" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-coffee">Email</span>
          <input
            className="kv-input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-coffee">Password</span>
          <input
            className="kv-input"
            type="text"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-coffee">Role</span>
          <select
            className="kv-input"
            value={role}
            onChange={(e) => setRole(e.target.value as "STUDENT" | "ADMIN")}
          >
            <option value="STUDENT">Student</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>
      </div>
      <div className="mt-4 flex gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-ctl bg-teal px-4 py-2 text-sm font-bold text-accent-ink transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Creating…" : "Create account"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-ctl border border-line px-4 py-2 text-sm font-semibold text-coffee hover:bg-hover"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-3 font-semibold ${className}`}>{children}</th>;
}
function Td({
  children,
  className = "",
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td className={`px-4 py-3 ${className}`} colSpan={colSpan}>
      {children}
    </td>
  );
}
function Badge({ children, tone }: { children: React.ReactNode; tone: "accent" | "muted" | "green" | "red" }) {
  const tones = {
    accent: "bg-teal-soft text-teal-deep",
    muted: "bg-hover text-coffee",
    green: "bg-green-bg text-green border border-green-line",
    red: "bg-red-bg text-red border border-red-line",
  } as const;
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}
function Action({
  children,
  onClick,
  disabled,
  tone,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "danger";
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rounded-ctl border px-2.5 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        tone === "danger"
          ? "border-red-line text-red hover:bg-red-bg"
          : "border-line text-coffee hover:bg-hover"
      }`}
    >
      {children}
    </button>
  );
}
