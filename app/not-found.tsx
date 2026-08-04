import Link from "next/link";
import { KoelMark } from "@/components/koel";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-[60vh] max-w-2xl place-items-center px-5 text-center">
      <div>
        <div className="flex justify-center">
          <KoelMark size={56} className="text-cocoa" />
        </div>
        <h1 className="mt-4 text-3xl font-black">Nothing here</h1>
        <p className="mt-2 text-cocoa">This page doesn&apos;t exist. Back to the questions.</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-[14px] bg-teal px-6 py-3 font-extrabold text-white shadow-warm-sm transition hover:bg-teal-deep"
        >
          Back to Koveline
        </Link>
      </div>
    </main>
  );
}
