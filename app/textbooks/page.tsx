import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TextbookReader } from "@/components/textbook-reader";
import siteCopy from "@/content/site-copy.json";

export const metadata: Metadata = {
  title: "Textbooks",
  description: "Read the Grade 9 and Grade 10 Islam curriculum textbooks.",
};

export default function TextbooksPage() {
  return (
    <main className="tb-page mx-auto max-w-[900px] px-5 pb-16 pt-6">
      <Link
        href="/"
        className="mb-5 inline-flex items-center gap-1.5 text-[0.84rem] font-bold text-cocoa transition hover:text-coffee"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> {siteCopy.customTest.backHome}
      </Link>

      <header className="tb-intro">
        <p className="tb-kicker">Textbooks</p>
        <h1>The curriculum books, in full.</h1>
        <p className="tb-sub">
          Both books open page by page, so you only load what you read.
        </p>
      </header>

      <TextbookReader />

      <p className="tb-credit">
        Published for the Islam curriculum. Reproduced here for students to read.
      </p>
    </main>
  );
}
