import Link from "next/link";
import { KoelMark } from "@/components/koel";
import siteCopy from "@/content/site-copy.json";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-[60vh] max-w-2xl place-items-center px-5 text-center">
      <div>
        <div className="flex justify-center">
          <KoelMark size={56} className="text-cocoa" />
        </div>
        <h1 className="mt-4 font-display text-3xl font-extrabold">{siteCopy.system.notFoundTitle}</h1>
        <p className="mt-2 text-cocoa">{siteCopy.system.notFoundBody}</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-ctl bg-teal px-6 py-3 font-bold text-accent-ink transition hover:bg-teal-deep hover:-translate-y-px"
        >
          {siteCopy.system.notFoundCta}
        </Link>
      </div>
    </main>
  );
}
