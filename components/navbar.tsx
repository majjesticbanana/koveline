import Link from "next/link";
import { KoelMark } from "./koel";

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/94">
      <div className="mx-auto flex h-[64px] max-w-[960px] items-center justify-between px-[20px]">
        <Link href="/" className="group flex items-center gap-2.5" aria-label="Koveline home">
          <KoelMark
            size={30}
            className="text-ink transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
          <span className="font-display text-[1.3rem] font-extrabold tracking-tight text-ink">
            Kove<span className="text-teal">line</span>
          </span>
        </Link>
        <nav className="flex items-center gap-4" aria-label="Main">
          <Link
            href="/#subjects"
            className="glass-control rounded-ctl border px-4 py-2 text-[0.88rem] font-bold text-ink transition hover:border-teal/70"
          >
            Start studying
          </Link>
        </nav>
      </div>
    </header>
  );
}
