import Link from "next/link";
import { KoelMark } from "./koel";

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-basalt-line bg-basalt/85 backdrop-blur-md">
      <div className="mx-auto flex h-[68px] max-w-[980px] items-center justify-between px-[22px]">
        <Link href="/" className="group flex items-center gap-3" aria-label="Koveline home">
          <span className="grid h-[42px] w-[42px] place-items-center rounded-[12px] bg-basalt-2 ring-1 ring-basalt-line transition-colors group-hover:bg-basalt-3">
            <KoelMark size={30} className="text-brass" />
          </span>
          <span className="font-display text-[1.4rem] font-bold tracking-tight text-on-dark">
            Kove<span className="text-brass">line</span>
          </span>
        </Link>
        <nav className="flex items-center gap-[18px]" aria-label="Main">
          <Link
            href="/#subjects"
            className="text-[0.94rem] font-semibold text-on-dark-dim transition-colors hover:text-on-dark"
          >
            Subjects
          </Link>
          <Link
            href="/islam/grade-9/mixed"
            className="rounded-full bg-brass px-4 py-1.5 text-[0.88rem] font-bold text-basalt transition hover:bg-brass-deep"
          >
            Start studying
          </Link>
        </nav>
      </div>
    </header>
  );
}
