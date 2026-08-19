"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { useSession } from "./session-provider";
import siteCopy from "@/content/site-copy.json";

/**
 * The one account control in the navbar. Signing in is optional: it exists so
 * progress follows a student to another device. So signed out this is a single
 * quiet link, never a wall or a prompt, and the menu behind it is three plain
 * rows rather than a page of explanation.
 */
export function NavAccount() {
  const { student, loading, signOut } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Reserve the space while /api/auth/me is in flight, so the navbar doesn't
  // twitch, and so "Sign in" never flashes at someone who is signed in.
  if (loading) return <span className="nav-account-placeholder" aria-hidden />;

  if (!student) {
    const next = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
    return (
      <Link
        href={`/login${next}`}
        className="nav-signin glass-control inline-flex items-center gap-1.5 rounded-ctl border px-3.5 py-2 text-[0.84rem] font-bold text-ink transition hover:border-teal/70"
        title={siteCopy.navigation.signInHint}
      >
        <UserRound className="h-4 w-4" aria-hidden />
        <span className="nav-signin-label">{siteCopy.navigation.signIn}</span>
      </Link>
    );
  }

  const label = student.name?.trim() || student.email;
  const initial = (label[0] ?? "?").toUpperCase();

  return (
    <div ref={ref} className="nav-menu relative">
      <button
        type="button"
        className="nav-account-trigger glass-control inline-flex items-center gap-1.5 rounded-ctl border px-2 py-1.5 text-ink transition hover:border-teal/70"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={siteCopy.navigation.accountAria}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="nav-account-avatar" aria-hidden>{initial}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      <div
        className={`nav-dropdown nav-account-dropdown glass-panel ${open ? "is-open" : ""}`}
        role="menu"
        aria-label={siteCopy.navigation.accountAria}
      >
        <div className="nav-account-head">
          <span className="nav-account-avatar nav-account-avatar-lg" aria-hidden>{initial}</span>
          <div>
            <strong>{label}</strong>
            <span>{student.email}</span>
          </div>
        </div>

        <div className="nav-dropdown-section nav-resources-section">
          <Link href="/account" role="menuitem" className="nav-resource-row" onClick={() => setOpen(false)}>
            <span className="nav-dropdown-icon"><UserRound className="h-4 w-4" aria-hidden /></span>
            <strong>{siteCopy.navigation.accountTitle}</strong>
          </Link>

          {student.role === "ADMIN" && (
            <Link href="/admin" role="menuitem" className="nav-resource-row" onClick={() => setOpen(false)}>
              <span className="nav-dropdown-icon"><ShieldCheck className="h-4 w-4" aria-hidden /></span>
              <strong>{siteCopy.navigation.adminTitle}</strong>
            </Link>
          )}

          <button
            type="button"
            role="menuitem"
            className="nav-resource-row w-full text-left"
            onClick={() => { setOpen(false); void signOut(); }}
          >
            <span className="nav-dropdown-icon"><LogOut className="h-4 w-4" aria-hidden /></span>
            <strong>{siteCopy.navigation.signOutTitle}</strong>
          </button>
        </div>
      </div>
    </div>
  );
}
