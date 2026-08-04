import Link from "next/link";
import { KoelMark } from "./koel";

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex h-[64px] max-w-[960px] items-center justify-between px-[22px]">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Koveline home">
          <KoelMark size={32} className="text-ink" />
          <span className="font-display text-[1.35rem] font-extrabold tracking-tight text-ink">
            Kove<span className="text-coffee">line</span>
          </span>
        </Link>
        <nav className="flex items-center gap-[18px]" aria-label="Main">
          <Link
            href="/#subjects"
            className="text-[0.94rem] font-semibold text-cocoa transition-colors hover:text-coffee"
          >
            Subjects
          </Link>
          <Link
            href="/islam/grade-9/mixed"
            className="rounded-full bg-teal px-4 py-1.5 text-[0.88rem] font-bold text-white transition hover:bg-teal-deep"
          >
            Start studying
          </Link>
        </nav>
      </div>
    </header>
  );
}
