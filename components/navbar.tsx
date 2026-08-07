import Link from "next/link";
import { KoelMark } from "./koel";

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex h-[62px] max-w-[960px] items-center justify-between px-[20px]">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Koveline home">
          <KoelMark size={30} className="text-ink" />
          <span className="font-display text-[1.3rem] font-extrabold tracking-tight text-ink">
            Kove<span className="text-coffee">line</span>
          </span>
        </Link>
        <nav className="flex items-center gap-4" aria-label="Main">
          <Link
            href="/#subjects"
            className="rounded-ctl bg-teal px-4 py-2 text-[0.88rem] font-bold text-white transition hover:bg-teal-deep"
          >
            Start studying
          </Link>
        </nav>
      </div>
    </header>
  );
}
